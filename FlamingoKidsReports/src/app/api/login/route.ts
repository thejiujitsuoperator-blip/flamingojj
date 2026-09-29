import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPasscode, passcodeConfigured, sessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!passcodeConfigured()) return Response.json({ error: "no-passcode" }, { status: 503 });
  let attempt = "";
  try {
    attempt = String(((await request.json()) as { passcode?: unknown }).passcode ?? "");
  } catch {
    /* empty attempt */
  }
  if (!(await checkPasscode(attempt))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: "wrong-passcode" }, { status: 401 });
  }
  (await cookies()).set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return Response.json({ ok: true });
}
