import { isCoach, passcodeConfigured } from "@/lib/auth";
import { isShareId, newShareId, saveReport } from "@/lib/shareStore";
import { storeConfigured } from "@/lib/storage";
import type { ReportCard } from "@/lib/kidsReport";

const MAX_BYTES = 1_000_000;

function looksLikeReport(r: unknown): r is ReportCard {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.name === "string" &&
    typeof x.period === "string" &&
    Array.isArray(x.superpowers) &&
    Array.isArray(x.traits) &&
    typeof x.journey === "string" &&
    typeof x.coachNote === "string" &&
    (x.photo === "" || (typeof x.photo === "string" && x.photo.startsWith("data:image/")))
  );
}

/**
 * Saves a report and returns its short id. Sending an existing id updates
 * that report in place, so a parent's link always shows the latest version.
 */
export async function POST(request: Request) {
  // Once a coach passcode is set, only signed-in coaches can publish reports.
  if (passcodeConfigured() && !(await isCoach())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!storeConfigured()) {
    console.error("[share] no storage: connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID) and redeploy");
    return Response.json({ error: "not-configured" }, { status: 503 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "too-large" }, { status: 413 });

  let body: { id?: unknown; report?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }
  if (!looksLikeReport(body.report)) return Response.json({ error: "bad-report" }, { status: 400 });

  const id = typeof body.id === "string" && isShareId(body.id) ? body.id : newShareId();
  try {
    await saveReport(id, body.report);
  } catch (e) {
    console.error("[share] could not save report", e);
    return Response.json({ error: "save-failed" }, { status: 502 });
  }
  return Response.json({ id });
}
