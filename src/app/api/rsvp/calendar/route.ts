import { icsFile } from "@/lib/calendar";
import { SESSIONS } from "@/lib/rsvp";

// GET /api/rsvp/calendar?s=workshop,meetGreet → an .ics event with the
// person's sessions in the notes. iPhones and Macs open it straight into
// Calendar; Outlook and others import it.
export function GET(request: Request) {
  const url = new URL(request.url);
  const keys = (url.searchParams.get("s") ?? "")
    .split(",")
    .filter((k) => SESSIONS.some((s) => s.key === k));
  const body = icsFile(keys, `${url.origin}/FlamingoCommunityRSVP`);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="flamingo-community-day.ics"',
      "Cache-Control": "no-store",
    },
  });
}
