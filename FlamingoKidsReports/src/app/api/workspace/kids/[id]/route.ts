import { requireCoach } from "@/lib/auth";
import type { Kid } from "@/lib/kidsReport";
import { deleteKid, isKidId, loadKid, saveKid } from "@/lib/workspaceStore";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2_000_000;

function looksLikeKid(k: unknown, id: string): k is Kid {
  if (!k || typeof k !== "object") return false;
  const x = k as Record<string, unknown>;
  const r = x.report as Record<string, unknown> | undefined;
  return (
    x.id === id &&
    Array.isArray(x.observations) &&
    !!r &&
    typeof r.name === "string" &&
    Array.isArray(r.superpowers) &&
    Array.isArray(r.traits)
  );
}

export async function GET(_req: Request, ctx: RouteContext<"/api/workspace/kids/[id]">) {
  const denied = await requireCoach();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isKidId(id)) return Response.json({ error: "bad-id" }, { status: 400 });
  try {
    const kid = await loadKid(id);
    return kid ? Response.json({ kid }) : Response.json({ error: "not-found" }, { status: 404 });
  } catch (e) {
    console.error("[workspace] kid load failed", e);
    return Response.json({ error: "load-failed" }, { status: 502 });
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/workspace/kids/[id]">) {
  const denied = await requireCoach();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isKidId(id)) return Response.json({ error: "bad-id" }, { status: 400 });
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "too-large" }, { status: 413 });
  let kid: unknown;
  try {
    kid = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }
  if (!looksLikeKid(kid, id)) return Response.json({ error: "bad-kid" }, { status: 400 });
  try {
    return Response.json({ kid: await saveKid(kid) });
  } catch (e) {
    console.error("[workspace] kid save failed", e);
    return Response.json({ error: "save-failed" }, { status: 502 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/workspace/kids/[id]">) {
  const denied = await requireCoach();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isKidId(id)) return Response.json({ error: "bad-id" }, { status: 400 });
  try {
    await deleteKid(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[workspace] kid delete failed", e);
    return Response.json({ error: "delete-failed" }, { status: 502 });
  }
}
