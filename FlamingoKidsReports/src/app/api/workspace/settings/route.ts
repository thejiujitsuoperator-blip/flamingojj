import { requireCoach } from "@/lib/auth";
import { saveSettings } from "@/lib/workspaceStore";

export async function PUT(request: Request) {
  const denied = await requireCoach();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { period?: unknown; traitNames?: unknown } | null;
  if (
    !body ||
    typeof body.period !== "string" ||
    !Array.isArray(body.traitNames) ||
    !body.traitNames.every((t) => typeof t === "string")
  ) {
    return Response.json({ error: "bad-settings" }, { status: 400 });
  }
  try {
    await saveSettings({ period: body.period, traitNames: body.traitNames as string[] });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[workspace] settings save failed", e);
    return Response.json({ error: "save-failed" }, { status: 502 });
  }
}
