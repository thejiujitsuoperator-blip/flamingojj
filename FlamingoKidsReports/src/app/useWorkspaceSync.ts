"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_TRAITS,
  currentPeriod,
  loadWorkspace,
  normalizeReport,
  saveWorkspace,
  type Kid,
  type Workspace,
} from "@/lib/kidsReport";

// Keeps the coach workspace in sync with the server (Vercel Blob):
//  - loads settings + every kid after sign-in,
//  - saves each changed kid (and deletes removed ones) about a second after
//    the last edit, retrying on failure,
//  - refreshes every 45s / on focus to pick up other coaches' changes,
//  - mirrors everything to localStorage, including which kids still have
//    unsaved changes, so a closed tab or lost connection doesn't lose work.
// When the server has no passcode or storage configured, it falls back to
// the browser-only workspace.

export type Mode = "loading" | "login" | "server" | "local";
type Settings = Pick<Workspace, "period" | "traitNames">;

const PENDING_KEY = "flamingo-kids-pending-v1";
const SAVE_DELAY = 1000;
const RETRY_DELAY = 10_000;
const REFRESH_EVERY = 45_000;

class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as T;
}

function normalizeKid(k: Kid): Kid {
  return { ...k, observations: k.observations ?? [], evaluation: k.evaluation ?? {}, report: normalizeReport(k.report) };
}

async function fetchKids(ids: string[]): Promise<Kid[]> {
  const out: Kid[] = [];
  for (let i = 0; i < ids.length; i += 6) {
    const batch = await Promise.all(
      ids.slice(i, i + 6).map((id) =>
        api<{ kid: Kid }>(`/api/workspace/kids/${id}`)
          .then((r) => normalizeKid(r.kid))
          .catch((e) => {
            if (e instanceof HttpError && e.status === 404) return null; // deleted meanwhile
            throw e;
          }),
      ),
    );
    out.push(...batch.filter((k): k is Kid => !!k));
  }
  return out;
}

function readPending(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writePending(ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(PENDING_KEY, JSON.stringify(ids));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    /* best effort */
  }
}

function hasLocalWorkspace(): boolean {
  try {
    return !!localStorage.getItem("flamingo-kids-reports-v1");
  } catch {
    return false;
  }
}

const sameSettings = (a: Settings | null, b: Settings) =>
  !!a && a.period === b.period && JSON.stringify(a.traitNames) === JSON.stringify(b.traitNames);

export function useWorkspaceSync() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [mode, setMode] = useState<Mode>("loading");
  const [localReason, setLocalReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [localOffer, setLocalOffer] = useState<Workspace | null>(null);

  const wsRef = useRef<Workspace | null>(null);
  const modeRef = useRef<Mode>("loading");
  // What the server holds, by object identity: a kid whose object differs
  // from its entry here has unsaved changes.
  const synced = useRef(new Map<string, Kid>());
  const versions = useRef(new Map<string, string>());
  const syncedSettings = useRef<Settings | null>(null);
  const flushing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushRef = useRef<() => void>(() => {});

  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const dirty = useCallback((w: Workspace) => {
    const ids = new Set(w.kids.map((x) => x.id));
    return {
      kids: w.kids.filter((x) => synced.current.get(x.id) !== x),
      deleted: [...synced.current.keys()].filter((id) => !ids.has(id)),
      settings: !sameSettings(syncedSettings.current, w),
    };
  }, []);

  /** Records what's still unsaved (badge + localStorage); returns true if anything is. */
  const trackPending = useCallback(
    (w: Workspace) => {
      const d = dirty(w);
      const ids = [...d.kids.map((x) => x.id), ...d.deleted];
      writePending(ids);
      setPendingCount(ids.length + (d.settings ? 1 : 0));
      return ids.length > 0 || d.settings;
    },
    [dirty],
  );

  // ── LOAD ──
  const load = useCallback(async () => {
    setMode("loading");
    let index: { settings: Settings | null; kids: { id: string; version: string }[] };
    try {
      index = await api("/api/workspace");
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        setMode("login");
        return;
      }
      const reason =
        e instanceof HttpError && e.status === 503
          ? "Cloud saving isn't set up yet (COACH_PASSCODE and a Blob store are needed), so data is kept in this browser only."
          : "Couldn't reach the server — working from this browser's copy. Changes here stay on this device.";
      setLocalReason(reason);
      const local = loadWorkspace();
      setWs(local);
      setMode("local");
      return;
    }

    const kids = await fetchKids(index.kids.map((k) => k.id)).catch(() => null);
    if (!kids) {
      setLocalReason("Couldn't load from the server. Reload to try again.");
      setWs(loadWorkspace());
      setMode("local");
      return;
    }
    synced.current = new Map(kids.map((k) => [k.id, k]));
    versions.current = new Map(index.kids.map((k) => [k.id, k.version]));
    syncedSettings.current = index.settings;

    let next: Workspace = {
      version: 1,
      period: index.settings?.period ?? currentPeriod(),
      traitNames: index.settings?.traitNames ?? [...DEFAULT_TRAITS],
      kids,
    };

    // Unsaved edits from a previous visit on this device go back in (and get
    // saved); ids missing from the cached copy were deletions.
    const pending = readPending();
    if (pending.length && hasLocalWorkspace()) {
      const cached = loadWorkspace();
      let list = next.kids;
      for (const id of pending) {
        const mine = cached.kids.find((x) => x.id === id);
        list = mine ? [...list.filter((x) => x.id !== id), mine] : list.filter((x) => x.id !== id);
      }
      next = { ...next, kids: list };
    }

    // A brand-new server workspace, but this browser has data from before
    // cloud saving: offer to upload it.
    if (!index.settings && !kids.length && hasLocalWorkspace() && !pending.length) {
      const cached = loadWorkspace();
      if (cached.kids.length) setLocalOffer(cached);
    }

    setWs(next);
    setMode("server");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // ── SAVE ──
  const flush = useCallback(async () => {
    const w = wsRef.current;
    if (!w || modeRef.current !== "server" || flushing.current) return;
    const todo = dirty(w);
    if (!todo.kids.length && !todo.deleted.length && !todo.settings) return;
    flushing.current = true;
    setSaving(true);
    let ok = true;
    try {
      if (todo.settings) {
        const s = { period: w.period, traitNames: w.traitNames };
        await api("/api/workspace/settings", { method: "PUT", body: JSON.stringify(s) });
        syncedSettings.current = s;
      }
      for (const id of todo.deleted) {
        await api(`/api/workspace/kids/${id}`, { method: "DELETE" });
        synced.current.delete(id);
        versions.current.delete(id);
      }
      for (const sent of todo.kids) {
        const { kid } = await api<{ kid: Kid }>(`/api/workspace/kids/${sent.id}`, {
          method: "PUT",
          body: JSON.stringify(sent),
        });
        const merged = normalizeKid(kid);
        versions.current.delete(sent.id); // next refresh re-reads the server version once
        const current = wsRef.current?.kids.find((x) => x.id === sent.id);
        if (current === sent) {
          // No edits since we sent it: take the merged copy (it may include
          // another coach's new observations).
          synced.current.set(sent.id, merged);
          setWs((cur) => (cur ? { ...cur, kids: cur.kids.map((x) => (x.id === sent.id ? merged : x)) } : cur));
        } else {
          synced.current.set(sent.id, sent);
        }
      }
    } catch (e) {
      ok = false;
      if (e instanceof HttpError && e.status === 401) setMode("login");
    } finally {
      flushing.current = false;
      setSaving(false);
      setFailed(!ok);
      // Anything edited while saving (or a failure) goes round again.
      if (wsRef.current && trackPending(wsRef.current)) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => flushRef.current(), ok ? SAVE_DELAY : RETRY_DELAY);
      }
    }
  }, [dirty, trackPending]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    if (!ws) return;
    if (mode === "local") {
      saveWorkspace(ws);
      return;
    }
    if (mode !== "server") return;
    saveWorkspace(ws); // local mirror
    // eslint-disable-next-line react-hooks/set-state-in-effect -- badge count mirrors the edit
    if (!trackPending(ws)) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), SAVE_DELAY);
  }, [ws, mode, trackPending, flush]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (modeRef.current === "server" && wsRef.current) {
        const d = dirty(wsRef.current);
        if (d.kids.length || d.deleted.length || d.settings) e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // ── REFRESH (other coaches' changes) ──
  const refresh = useCallback(async () => {
    const w = wsRef.current;
    if (!w || modeRef.current !== "server" || flushing.current) return;
    const d = dirty(w);
    if (d.kids.length || d.deleted.length || d.settings) return;
    try {
      const index = await api<{ settings: Settings | null; kids: { id: string; version: string }[] }>(
        "/api/workspace",
      );
      const changed = index.kids.filter((k) => versions.current.get(k.id) !== k.version).map((k) => k.id);
      const fresh = await fetchKids(changed);
      const onServer = new Set(index.kids.map((k) => k.id));
      const cur = wsRef.current;
      if (!cur || flushing.current) return;
      // Only touch kids with no local edits.
      const clean = (id: string) => {
        const mine = cur.kids.find((x) => x.id === id);
        return !mine || synced.current.get(id) === mine;
      };
      let kids = cur.kids;
      for (const k of fresh) {
        if (!clean(k.id)) continue;
        synced.current.set(k.id, k);
        kids = kids.some((x) => x.id === k.id) ? kids.map((x) => (x.id === k.id ? k : x)) : [...kids, k];
      }
      for (const k of index.kids) if (clean(k.id)) versions.current.set(k.id, k.version);
      const gone = kids.filter((x) => !onServer.has(x.id) && synced.current.get(x.id) === x);
      for (const g of gone) synced.current.delete(g.id);
      kids = kids.filter((x) => !gone.includes(x));
      let next: Workspace = { ...cur, kids };
      if (index.settings && sameSettings(syncedSettings.current, cur) && !sameSettings(index.settings, cur)) {
        syncedSettings.current = index.settings;
        next = { ...next, period: index.settings.period, traitNames: index.settings.traitNames };
      }
      if (next.kids !== cur.kids || next.period !== cur.period || next.traitNames !== cur.traitNames) setWs(next);
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) setMode("login");
    }
  }, [dirty]);

  useEffect(() => {
    if (mode !== "server") return;
    const tick = () => document.visibilityState === "visible" && refresh();
    const id = setInterval(tick, REFRESH_EVERY);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [mode, refresh]);

  // ── SIGN IN / OUT ──
  const login = useCallback(
    async (passcode: string): Promise<boolean> => {
      try {
        await api("/api/login", { method: "POST", body: JSON.stringify({ passcode }) });
      } catch {
        return false;
      }
      await load();
      return true;
    },
    [load],
  );

  const logout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    if (!readPending().length) {
      try {
        localStorage.removeItem("flamingo-kids-reports-v1"); // shared devices
      } catch {
        /* ignore */
      }
    }
    synced.current = new Map();
    syncedSettings.current = null;
    setWs(null);
    setMode("login");
  }, []);

  const acceptLocalOffer = useCallback(() => {
    if (!localOffer) return;
    setWs((cur) =>
      cur
        ? {
            ...cur,
            period: localOffer.period,
            traitNames: localOffer.traitNames,
            kids: [...cur.kids, ...localOffer.kids.filter((x) => !cur.kids.some((y) => y.id === x.id))],
          }
        : cur,
    );
    setLocalOffer(null);
  }, [localOffer]);

  const status: "local" | "saved" | "saving" | "error" =
    mode !== "server" ? "local" : failed && pendingCount ? "error" : saving || pendingCount ? "saving" : "saved";

  return {
    ws,
    setWs,
    mode,
    localReason,
    status,
    login,
    logout,
    localOffer,
    acceptLocalOffer,
    dismissLocalOffer: () => setLocalOffer(null),
    saveNow: flush,
  };
}
