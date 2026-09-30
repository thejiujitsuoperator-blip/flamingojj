import { SESSIONS } from "@/lib/rsvp";

// Community Day, Sun 11 Oct 2026, 9:45am–3:00pm India time (UTC+5:30).
export const EVENT = {
  title: "Flamingo turns 4 — Community Day",
  startUtc: "20261011T041500Z",
  endUtc: "20261011T093000Z",
  location: "Flamingo Jiu-Jitsu, HSR Layout, Bengaluru",
  directions: "https://maps.app.goo.gl/Tkn43vwU8J89QMBD6",
};

export function eventDescription(sessionKeys: string[], rsvpUrl: string): string {
  const mine = SESSIONS.filter((s) => sessionKeys.includes(s.key));
  const lines = ["Door opens 9:45am."];
  if (mine.length) {
    lines.push("", "Your sessions:", ...mine.map((s) => `• ${s.time} — ${s.title}`));
  }
  lines.push("", `Directions: ${EVENT.directions}`);
  if (rsvpUrl) lines.push(`Event page: ${rsvpUrl}`);
  return lines.join("\n");
}

export function googleCalendarUrl(sessionKeys: string[], rsvpUrl: string): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${EVENT.startUtc}/${EVENT.endUtc}`,
    details: eventDescription(sessionKeys, rsvpUrl),
    location: EVENT.location,
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines over 75 octets must be folded (RFC 5545). Count UTF-8 bytes, since
// "—" and "•" take three each, and never split a character.
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function icsFile(sessionKeys: string[], rsvpUrl: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flamingo Jiu-Jitsu//Community Day//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:community-day-2026@flamingojiujitsu.com",
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
    `DTSTART:${EVENT.startUtc}`,
    `DTEND:${EVENT.endUtc}`,
    `SUMMARY:${icsEscape(EVENT.title)}`,
    `LOCATION:${icsEscape(EVENT.location)}`,
    `DESCRIPTION:${icsEscape(eventDescription(sessionKeys, rsvpUrl))}`,
    `URL:${EVENT.directions}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(EVENT.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
