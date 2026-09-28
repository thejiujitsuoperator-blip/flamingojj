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

function parseBody(body: unknown): RsvpInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || typeof b.phone !== "string") return null;
  if (typeof b.guests !== "number" || !Array.isArray(b.sessions)) return null;
  if (!b.sessions.every((s) => typeof s === "string")) return null;
  return {
    name: b.name.slice(0, 120),
    phone: b.phone.slice(0, 32),
    guests: b.guests,
    sessions: [...new Set(b.sessions as string[])],
  };
}

async function saveToGoogleForm(r: RsvpInput, sessionTitles: string[]): Promise<boolean> {
  const form = new URLSearchParams();
  form.append(FORM_ENTRIES.name, r.name.trim());
  form.append(FORM_ENTRIES.phone, r.phone.trim());
  form.append(FORM_ENTRIES.guests, String(r.guests));
  for (const title of sessionTitles) form.append(FORM_ENTRIES.sessions, title);
  try {
    const res = await fetch(FORM_URL, {
      method: "POST",
      body: form,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok || (res.status >= 300 && res.status < 400);
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

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const rsvp = parseBody(raw);
  if (!rsvp) return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const errors = validateRsvp(rsvp);
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  const sessionTitles = SESSIONS.filter((s) => rsvp.sessions.includes(s.key)).map((s) => s.title);

  const saved = await saveToGoogleForm(rsvp, sessionTitles);
  if (!saved) {
    return Response.json(
      { ok: false, error: "We couldn’t save your RSVP just now — please try again in a moment." },
      { status: 502 },
    );
  }

  const whatsapp = await sendWhatsAppConfirmation(rsvp, sessionTitles);
  return Response.json({ ok: true, whatsapp });
}
