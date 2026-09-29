import "server-only";
import { cookies } from "next/headers";

// Coach access: one shared passcode (COACH_PASSCODE). Signing in sets an
// httpOnly cookie holding an HMAC derived from the passcode, so changing the
// passcode signs every device out.

export const SESSION_COOKIE = "kr_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function passcode(): string {
  return (process.env.COACH_PASSCODE ?? "").trim();
}

export function passcodeConfigured(): boolean {
  return passcode().length > 0;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Buffer.from(sig).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function sessionToken(): Promise<string> {
  return hmac(passcode(), "flamingo-kids-reports/coach-session/v1");
}

export async function checkPasscode(attempt: string): Promise<boolean> {
  if (!passcodeConfigured()) return false;
  // Compare HMACs so the comparison doesn't leak the passcode's length.
  const salt = "flamingo-kids-reports/check";
  return safeEqual(await hmac(salt, attempt.trim()), await hmac(salt, passcode()));
}

export async function isCoach(): Promise<boolean> {
  if (!passcodeConfigured()) return false;
  const value = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return safeEqual(value, await sessionToken());
}

/**
 * Guard for coach-only API routes. Returns a Response to send back when the
 * request isn't allowed, or null to carry on.
 */
export async function requireCoach(): Promise<Response | null> {
  if (!passcodeConfigured()) return Response.json({ error: "no-passcode" }, { status: 503 });
  if (!(await isCoach())) return Response.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
