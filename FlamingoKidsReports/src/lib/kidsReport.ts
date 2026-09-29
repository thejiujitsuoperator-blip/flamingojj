// ── KIDS PROGRESS REPORTS ──
// Types, presets, persistence, CSV import and share-link encoding for the
// "My Jiu-Jitsu Journey" report card.

export type TraitLevel = 0 | 1 | 2 | 3; // 0 not rated · 1 starting · 2 growing · 3 strong

export const TRAIT_LEVELS: { level: TraitLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: "🌱", label: "starting" },
  { level: 2, emoji: "🌿", label: "growing" },
  { level: 3, emoji: "🌳", label: "strong" },
];

export interface Superpower {
  emoji: string;
  title: string;
  text: string;
}

export interface Trait {
  name: string;
  level: TraitLevel;
}

export interface Observation {
  id: string;
  date: string;
  coach: string;
  text: string;
}

/** Everything that is printed on the report card (and shared with parents). */
export interface ReportCard {
  name: string;
  group: string; // one of GROUPS
  batch: string; // one of BATCHES
  period: string; // "JAN – AUG 2026"
  photo: string; // data URL, "" for none
  superpowers: Superpower[];
  traits: Trait[];
  journey: string;
  nextLevel: string;
  badge: string;
  coachNote: string;
}

/** A kid in the coach workspace: the report plus private working notes. */
export interface Kid {
  id: string;
  report: ReportCard;
  observations: Observation[];
  /** Raw assessment scores imported from the "Kids Evaluation" sheet. */
  evaluation: Record<string, string>;
  /** Ids of observations that were deleted (so a merge doesn't bring them back). */
  removedObs?: string[];
  /** Short parent-link id (/r/<id>); re-sharing updates the same link. */
  shareId?: string;
  updatedAt: string;
}

export interface Workspace {
  version: 1;
  period: string;
  traitNames: string[];
  kids: Kid[];
}

// ── PRESETS ──
export const GROUPS = ["Cub", "Junior", "Youth"];
export const BATCHES = ["Weekday batch", "Weekend batch"];

/** Maps free-typed or older values ("cub", "weekday batch") onto the fixed lists. */
function pick(options: string[], value: string): string {
  const v = value.trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === v || o.toLowerCase().startsWith(v.split(" ")[0] || "-")) ?? options[0];
}

export function normalizeReport(r: ReportCard): ReportCard {
  return { ...r, group: pick(GROUPS, r.group ?? ""), batch: pick(BATCHES, r.batch ?? "") };
}

export const DEFAULT_TRAITS = [
  "Following Instructions",
  "Movement",
  "Technique",
  "Teamwork",
  "Persistence",
  "Focus",
];

export const SUPERPOWER_PRESETS: Superpower[] = [
  { emoji: "🧠", title: "The Fast Learner", text: "You pick up new movements and ideas super quickly!" },
  { emoji: "👀", title: "Sharp Observer", text: "You follow instructions and pick up techniques pretty well." },
  { emoji: "🎯", title: "Focus Mode", text: "Distinct ability to focus on the session for your age." },
  { emoji: "🤝", title: "Great Playmate", text: "You love being on the mat with your friends and bring good energy to the room." },
  { emoji: "🦁", title: "Brave Heart", text: "You try new things on the mat even when they feel a little scary." },
  { emoji: "💪", title: "Never Give Up", text: "When something is hard you keep trying until you get it." },
  { emoji: "👂", title: "Super Listener", text: "You listen carefully to your coaches and put it into action." },
  { emoji: "⚡", title: "Energy Booster", text: "Your energy lights up every class you are in." },
  { emoji: "🧲", title: "Sticky Grips", text: "Once you hold on, nobody is getting away!" },
  { emoji: "🐍", title: "Escape Artist", text: "You wriggle out of tricky spots like a pro." },
  { emoji: "🌟", title: "Kind Friend", text: "You help your friends and make everyone feel welcome." },
  { emoji: "🏗️", title: "Solid Base", text: "You stay strong and balanced when others push and pull." },
];

export const BADGE_PRESETS = [
  "Fast Learner",
  "Sharp Observer",
  "Focus Master",
  "Team Player",
  "Never Give Up",
  "Brave Heart",
  "Escape Artist",
  "Super Listener",
];

export function currentPeriod(d = new Date()): string {
  const m = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
  return `JAN – ${m} ${d.getFullYear()}`;
}

export function uid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

export function blankReport(name: string, ws: Pick<Workspace, "period" | "traitNames">): ReportCard {
  return {
    name,
    group: "Cub",
    batch: "Weekday batch",
    period: ws.period,
    photo: "",
    superpowers: SUPERPOWER_PRESETS.slice(0, 4).map((s) => ({ ...s })),
    traits: ws.traitNames.map((n) => ({ name: n, level: 0 })),
    journey: "",
    nextLevel: "",
    badge: "Fast Learner",
    coachNote: "",
  };
}

export function newKid(name: string, ws: Workspace): Kid {
  return {
    id: uid(),
    report: blankReport(name, ws),
    observations: [],
    evaluation: {},
    updatedAt: new Date().toISOString(),
  };
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** The sample report from the template, used for the demo kid. */
export const SAMPLE_REPORT: ReportCard = {
  name: "Musab",
  group: "Cub",
  batch: "Weekday batch",
  period: "JAN – AUG 2026",
  photo: "",
  superpowers: SUPERPOWER_PRESETS.slice(0, 4).map((s) => ({ ...s })),
  traits: [
    { name: "Following Instructions", level: 3 },
    { name: "Movement", level: 2 },
    { name: "Technique", level: 3 },
    { name: "Teamwork", level: 2 },
    { name: "Persistence", level: 1 },
    { name: "Focus", level: 2 },
  ],
  journey:
    "Musab first walked in with his hands in his pockets, quietly taking it all in. We weren't even sure how much he would be able to do at first.\nThen came the surprise—he had been watching closely! When asked to show the move, he pulled it off beautifully. Since then, he has gone from quietly watching to running, playing, laughing and making friends all over the mat. 💛",
  nextLevel:
    "We're going to encourage Musab's love for playing with his peers and channel that energy into more structured play. Over the next quarter, we'll challenge him with more games and physical activities that help him develop his endurance, strength and movement skills while keeping the fun alive.",
  badge: "Fast Learner",
  coachNote:
    "Musab, it's so much fun watching you discover what you can do on the mat! You have a fantastic ability to learn and understand movement for your age. Keep playing, keep exploring and keep having fun—we're excited to see what you unlock next! Keep moving. Keep playing. Keep growing.",
};

// ── PERSISTENCE (browser localStorage) ──
const STORAGE_KEY = "flamingo-kids-reports-v1";

export function emptyWorkspace(): Workspace {
  return { version: 1, period: currentPeriod(), traitNames: [...DEFAULT_TRAITS], kids: [] };
}

export function demoWorkspace(): Workspace {
  const ws: Workspace = { ...emptyWorkspace(), period: SAMPLE_REPORT.period };
  const kid = newKid("Musab", ws);
  kid.report = structuredClone(SAMPLE_REPORT);
  kid.observations = [
    { id: uid(), date: "2026-01-12", coach: "Coach", text: "First class — hands in pockets, watched everything quietly." },
    { id: uid(), date: "2026-01-19", coach: "Coach", text: "Asked to demo the shrimp — nailed it first try! Had clearly been watching." },
    { id: uid(), date: "2026-05-04", coach: "Coach", text: "Running around with the others, laughing. Needs more endurance for the last games." },
  ];
  ws.kids.push(kid);
  return ws;
}

export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ws = JSON.parse(raw) as Workspace;
      if (ws && ws.version === 1 && Array.isArray(ws.kids)) {
        return { ...ws, kids: ws.kids.map((k) => ({ ...k, report: normalizeReport(k.report) })) };
      }
    }
  } catch {
    /* fall through to demo data */
  }
  return demoWorkspace();
}

export function saveWorkspace(ws: Workspace): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save";
  }
}

// ── CSV IMPORT (Kids Evaluation tab) ──
export function parseCsv(text: string): string[][] {
  // Accept tab-separated text too (what you get when copying cells from Sheets).
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
}

export interface EvalImport {
  items: string[]; // assessment item names (column headers minus the name column)
  kids: { name: string; scores: Record<string, string> }[];
}

const NAME_HEADER = /^(kid'?s?\s*)?(student|child|member|kid|full)?\s*name$|^name\b|^kid$|^student$|^child$/i;

/**
 * Turns the evaluation sheet into per-kid scores. The sheet may have one row
 * per kid (items across the top) or one column per kid (items down the side);
 * `transpose` flips between the two.
 */
export function readEvaluation(rows: string[][], transpose = false): EvalImport {
  let grid = rows;
  if (transpose) {
    const width = Math.max(...rows.map((r) => r.length));
    grid = Array.from({ length: width }, (_, c) => rows.map((r) => r[c] ?? ""));
  }
  if (grid.length < 2) return { items: [], kids: [] };
  // Header row: first row that has a "name"-like cell, else the first row.
  let h = grid.findIndex((r) => r.some((c) => NAME_HEADER.test(c)));
  if (h < 0) h = 0;
  const header = grid[h];
  let nameCol = header.findIndex((c) => NAME_HEADER.test(c));
  if (nameCol < 0) nameCol = 0;
  const items = header
    .map((c, i) => ({ c: c || `Item ${i + 1}`, i }))
    .filter(({ i }) => i !== nameCol);
  const kids = grid
    .slice(h + 1)
    .filter((r) => (r[nameCol] ?? "").trim())
    .map((r) => {
      const scores: Record<string, string> = {};
      items.forEach(({ c, i }) => {
        if ((r[i] ?? "") !== "") scores[c] = r[i];
      });
      return { name: r[nameCol].trim(), scores };
    });
  return { items: items.map((x) => x.c), kids };
}

/**
 * Suggests a 🌱/🌿/🌳 level for each trait from evaluation items whose name
 * matches the trait. Numbers are scaled against the highest score in that
 * column across the whole sheet; words like "strong"/"growing" map directly.
 */
export function suggestTraitLevels(
  traitNames: string[],
  scores: Record<string, string>,
  columnMax: Record<string, number>,
): Record<string, TraitLevel> {
  const out: Record<string, TraitLevel> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const t of traitNames) {
    const nt = norm(t);
    const matches = Object.keys(scores).filter((k) => {
      const nk = norm(k);
      return nk === nt || nk.includes(nt) || nt.includes(nk);
    });
    const levels: number[] = [];
    for (const k of matches) {
      const v = scores[k].trim().toLowerCase();
      const n = parseFloat(v);
      if (!Number.isNaN(n) && columnMax[k] > 0) {
        levels.push(Math.min(3, Math.max(1, Math.ceil((n / columnMax[k]) * 3))));
      } else if (/strong|excellent|great|advanced|high/.test(v)) levels.push(3);
      else if (/grow|good|average|medium|developing|ok/.test(v)) levels.push(2);
      else if (/start|begin|low|needs|poor/.test(v)) levels.push(1);
    }
    if (levels.length) {
      out[t] = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) as TraitLevel;
    }
  }
  return out;
}

export function columnMaxima(kids: { scores: Record<string, string> }[]): Record<string, number> {
  const max: Record<string, number> = {};
  for (const k of kids) {
    for (const [item, v] of Object.entries(k.scores)) {
      const n = parseFloat(v);
      if (!Number.isNaN(n)) max[item] = Math.max(max[item] ?? 0, n);
    }
  }
  return max;
}

// ── SHARE LINKS ──
// The report travels inside the link's #fragment, compressed. Nothing is
// uploaded anywhere: the fragment never leaves the parent's browser.
function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export async function encodeReport(r: ReportCard): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(r));
  return toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

export async function decodeReport(s: string): Promise<ReportCard> {
  const bytes = await pipe(fromBase64Url(s), new DecompressionStream("deflate-raw"));
  return JSON.parse(new TextDecoder().decode(bytes)) as ReportCard;
}

// ── IMAGES ──
/** Reads an uploaded photo, crops it square around the centre and shrinks it. */
export function resizePhoto(file: Blob, size = 360, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

/** Re-encodes a data-URL photo smaller so share links stay short. */
export async function shrinkPhoto(dataUrl: string, size = 200, quality = 0.7): Promise<string> {
  if (!dataUrl) return "";
  const blob = await (await fetch(dataUrl)).blob();
  return resizePhoto(blob, size, quality);
}
