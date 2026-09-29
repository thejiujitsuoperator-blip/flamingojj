import "server-only";
import type { Kid, Observation, Workspace } from "./kidsReport";
import { deleteJson, getJson, listEntries, putJson } from "./storage";

// The coach workspace on the server: workspace/settings.json plus one
// workspace/kids/<id>.json per kid, so coaches editing different kids never
// overwrite each other.

export type Settings = Pick<Workspace, "period" | "traitNames">;

const SETTINGS = "workspace/settings.json";
const KIDS = "workspace/kids/";
const KID_ID = /^[a-z0-9]{6,40}$/;

export function isKidId(id: string): boolean {
  return KID_ID.test(id);
}

export async function loadSettings(): Promise<Settings | null> {
  return getJson<Settings>(SETTINGS);
}

export async function saveSettings(s: Settings): Promise<void> {
  await putJson(SETTINGS, { period: s.period, traitNames: s.traitNames });
}

export async function listKids(): Promise<{ id: string; version: string }[]> {
  const entries = await listEntries(KIDS);
  return entries
    .map((e) => ({ id: e.path.slice(KIDS.length).replace(/\.json$/, ""), version: e.version }))
    .filter((k) => isKidId(k.id));
}

export async function loadKid(id: string): Promise<Kid | null> {
  return getJson<Kid>(`${KIDS}${id}.json`);
}

/**
 * Saves a kid. The report fields are last-write-wins, but observations are
 * merged with what's stored so two coaches adding notes at the same time
 * both keep theirs. Deleted observations are remembered in `removedObs`.
 */
export async function saveKid(incoming: Kid): Promise<Kid> {
  const stored = await loadKid(incoming.id);
  const removed = new Set([...(stored?.removedObs ?? []), ...(incoming.removedObs ?? [])]);
  const byId = new Map<string, Observation>();
  for (const o of [...(stored?.observations ?? []), ...incoming.observations]) {
    if (!removed.has(o.id)) byId.set(o.id, o);
  }
  const merged: Kid = {
    ...incoming,
    observations: [...byId.values()].sort((a, b) => b.date.localeCompare(a.date)),
    removedObs: [...removed],
  };
  await putJson(`${KIDS}${incoming.id}.json`, merged);
  return merged;
}

export async function deleteKid(id: string): Promise<void> {
  await deleteJson(`${KIDS}${id}.json`);
}
