import {
  SESSIONS,
  firstName,
  guestsText,
  toWhatsAppNumber,
  validateRsvp,
  type RsvpInput,
} from "@/lib/rsvp";

// Responses land in the Google Form (and the Sheet linked to it). Defaults are
// the form the RSVP design was wired to; override per deployment via env.
const FORM_URL =
  process.env.RSVP_GOOGLE_FORM_URL ??
  "https://docs.google.com/forms/d/e/1FAIpQLSfore4RPjNg9T6SqnFh7-sYv8RVYkrQ3HhWLRP6ssj3XiTSRw/formResponse";
const FORM_ENTRIES = {
  name: process.env.RSVP_ENTRY_NAME ?? "entry.253259911",
  phone: process.env.RSVP_ENTRY_PHONE ?? "entry.1822247826",
  guests: process.env.RSVP_ENTRY_GUESTS ?? "entry.1300379064",
  sessions: process.env.RSVP_ENTRY_SESSIONS ?? "entry.1849603472",
};

// WhatsApp Cloud API (Meta). Messages to people who haven't messaged the
// business first must use an approved template; see README.
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_TEMPLATE = process.env.WHATSAPP_TEMPLATE_NAME ?? "rsvp_confirmation";
const WA_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG ?? "en";
const WA_API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const DEFAULT_COUNTRY_CODE = process.env.RSVP_DEFAULT_COUNTRY_CODE ?? "91";

type WhatsAppStatus = "sent" | "failed" | "not_configured";

// Android autofill and numbers copied from Contacts carry invisible
// direction marks (U+202A/U+202C etc.) and non-breaking spaces. They pass our
// validation but fail any validation on the Google Form, so strip them.
function clean(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\p{Cf}\p{Cc}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Google's error page is a whole form; keep just the readable text so the log
// shows which question it rejected and why.
function readableGoogleError(html: string): string {
  const text = html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 1500);
}

function maskPhone(phone: string): string {
  return phone.replace(/\d(?=(?:\D*\d){4})/g, "•");
}

function parseBody(body: unknown): RsvpInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || typeof b.phone !== "string") return null;
  if (typeof b.guests !== "number" || !Array.isArray(b.sessions)) return null;
  if (!b.sessions.every((s) => typeof s === "string")) return null;
  return {
    name: clean(b.name).slice(0, 120),
    phone: clean(b.phone).slice(0, 32),
    guests: b.guests,
    sessions: [...new Set(b.sessions as string[])],
  };
}

async function postToGoogleForm(r: RsvpInput, sessionValues: string[]): Promise<number> {
  const form = new URLSearchParams();
  form.append(FORM_ENTRIES.name, r.name.trim());
  form.append(FORM_ENTRIES.phone, r.phone.trim());
  form.append(FORM_ENTRIES.guests, String(r.guests));
  for (const value of sessionValues) form.append(FORM_ENTRIES.sessions, value);
  const res = await fetch(FORM_URL, {
    method: "POST",
    body: form,
    // A redirect here means Google wants a sign-in, i.e. nothing was saved.
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const where = res.headers.get("location") ?? "";
    const sent = `name="${r.name}" phone="${maskPhone(r.phone)}" guests=${r.guests} sessions=${JSON.stringify(sessionValues)}`;
    const reason = where || readableGoogleError(await res.text());
    console.error(`RSVP: Google Form responded ${res.status} for ${sent} — ${reason}`);
    if (where.includes("accounts.google.com")) {
      console.error("RSVP: the form requires Google sign-in — turn off “Restrict to users in <organisation>” in the form's settings");
    }
  }
  return res.status;
}

async function saveToGoogleForm(r: RsvpInput, sessionTitles: string[]): Promise<boolean> {
  try {
    // The sessions question may be checkboxes (one value per box) or a text
    // field (Google rejects repeated values there), so fall back to one line.
    const status = await postToGoogleForm(r, sessionTitles);
    if (status === 200) return true;
    if (status === 400 && sessionTitles.length > 1) {
      return (await postToGoogleForm(r, [sessionTitles.join(", ")])) === 200;
    }
    return false;
  } catch (err) {
    console.error("RSVP: Google Form submission failed", err);
    return false;
  }
}

async function sendWhatsAppConfirmation(r: RsvpInput, sessionTitles: string[]): Promise<WhatsAppStatus> {
  if (!WA_TOKEN || !WA_PHONE_NUMBER_ID) return "not_configured";
  // Template parameters can't contain newlines, so keep this on one line.
  const summary = `${guestsText(r.guests)} · ${sessionTitles.join(", ")}`;
  try {
    const res = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toWhatsAppNumber(r.phone, DEFAULT_COUNTRY_CODE),
        type: "template",
        template: {
          name: WA_TEMPLATE,
          language: { code: WA_TEMPLATE_LANG },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: firstName(r.name) },
                { type: "text", text: summary },
              ],
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("RSVP: WhatsApp send failed", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("RSVP: WhatsApp send failed", err);
    return "failed";
  }
}

// Up to two Google Form attempts plus WhatsApp, each capped at 10s.
export const maxDuration = 30;

function device(request: Request): string {
  const ua = request.headers.get("user-agent") ?? "";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : "other";
  const app = /WhatsApp/i.test(ua) ? " (WhatsApp)" : /Instagram/i.test(ua) ? " (Instagram)" : /FBAN|FBAV/i.test(ua) ? " (Facebook)" : /; wv\)/.test(ua) ? " (in-app)" : "";
  return os + app;
}

export async function POST(request: Request) {
  const from = device(request);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    console.error(`RSVP: unreadable request from ${from}`);
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const rsvp = parseBody(raw);
  if (!rsvp) {
    console.error(`RSVP: malformed request from ${from}`);
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const errors = validateRsvp(rsvp);
  if (Object.keys(errors).length) {
    console.warn(`RSVP: rejected from ${from}:`, Object.values(errors).join(" | "));
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  const sessionTitles = SESSIONS.filter((s) => rsvp.sessions.includes(s.key)).map((s) => s.title);

  const saved = await saveToGoogleForm(rsvp, sessionTitles);
  console.log(`RSVP: ${saved ? "saved" : "NOT saved"} for "${rsvp.name}" from ${from}`);
  if (!saved) {
    return Response.json(
      { ok: false, error: "We couldn’t save your RSVP just now — please try again in a moment." },
      { status: 502 },
    );
  }

  const whatsapp = await sendWhatsAppConfirmation(rsvp, sessionTitles);
  return Response.json({ ok: true, whatsapp });
}
