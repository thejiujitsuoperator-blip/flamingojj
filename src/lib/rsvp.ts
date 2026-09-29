// Shared between the Community Day RSVP page and its API route.

export interface SessionDef {
  key: string;
  time: string;
  title: string;
  desc: string;
  highlight: boolean;
}

export const SESSIONS: SessionDef[] = [
  { key: "workshop", time: "10:00 AM", title: "Free Workshop", desc: "Hands-on movement & martial arts session — two self-defense scenarios we train at Flamingo. Open to anyone, no experience needed.", highlight: true },
  { key: "kidsComp", time: "10:45 AM", title: "Kids in-house competition", desc: "Our young athletes compete in front of family and friends.", highlight: false },
  { key: "adultsComp", time: "11:15 AM", title: "Adults in-house competition", desc: "Adult brackets kick off across the mats.", highlight: false },
  { key: "kidsFinals", time: "11:45 AM", title: "Kids finals & grading", desc: "Finals matches and belt grading for the kids program.", highlight: false },
  { key: "meetGreet", time: "12:00 PM", title: "Meet & greet", desc: "Mingle with athletes, coaches and the wider community — grab a bite while you’re at it.", highlight: true },
  { key: "adultsFinals", time: "12:30 – 2:30 PM", title: "Adults finals, absolutes & grading", desc: "The adult program wraps up with finals, absolute divisions and grading.", highlight: false },
  { key: "wrapUp", time: "2:30 – 3:00 PM", title: "Wrap up", desc: "Closing remarks and thank-yous before we call it a day.", highlight: false },
];

export const MAX_GUESTS = 10;

export interface RsvpInput {
  name: string;
  phone: string;
  guests: number;
  sessions: string[]; // session keys
}

export type RsvpErrors = Partial<Record<"name" | "phone" | "guests" | "sessions", string>>;

export function validateRsvp(r: RsvpInput): RsvpErrors {
  const errors: RsvpErrors = {};
  if (r.name.trim().length < 2) errors.name = "Please enter your name.";
  const digits = r.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) errors.phone = "Please enter a valid contact number (at least 10 digits).";
  if (!Number.isInteger(r.guests) || r.guests < 0 || r.guests > MAX_GUESTS) errors.guests = "Guests must be between 0 and 10.";
  if (r.sessions.length === 0) errors.sessions = "Tick at least one session you’ll attend in “How the day flows” above.";
  else if (r.sessions.some((k) => !SESSIONS.some((s) => s.key === k))) errors.sessions = "Unknown session selected.";
  return errors;
}

export function guestsText(guests: number): string {
  return guests === 0 ? "Just you" : `You + ${guests} ${guests === 1 ? "guest" : "guests"}`;
}

export function sessionsText(count: number): string {
  return `${count} ${count === 1 ? "session" : "sessions"}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

// Turns what people type ("98450 12345", "+91 98450-12345", "098450 12345")
// into WhatsApp's international format without "+" (e.g. "919845012345").
// A bare 10-digit number is assumed local and gets `defaultCountryCode`.
export function toWhatsAppNumber(phone: string, defaultCountryCode: string): string {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return defaultCountryCode + digits;
  return digits;
}
