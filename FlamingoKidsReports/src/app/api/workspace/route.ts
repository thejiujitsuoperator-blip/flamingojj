import { requireCoach } from "@/lib/auth";
import { storeConfigured } from "@/lib/storage";
import { listKids, loadSettings } from "@/lib/workspaceStore";

export const dynamic = "force-dynamic";

/** Settings plus the list of kids and their versions (kids are fetched one by one). */
export async function GET() {
  const denied = await requireCoach();
  if (denied) return denied;
  if (!storeConfigured()) return Response.json({ error: "no-storage" }, { status: 503 });
  try {
    const [settings, kids] = await Promise.all([loadSettings(), listKids()]);
    return Response.json({ settings, kids });
  } catch (e) {
    console.error("[workspace] load failed", e);
    return Response.json({ error: "load-failed" }, { status: 502 });
  }
}
