// Reads a Google Form's questions so answers can be sent in exactly the form
// Google expects. A checkbox answer must match an option's text exactly, or
// Google rejects the whole response; this lets the site's session names drift
// from the form's options (renamed, split at a comma, "&" vs "and") without
// losing RSVPs.

export interface FormQuestion {
  type: number; // 0 short answer, 1 paragraph, 2 multiple choice, 3 dropdown, 4 checkboxes
  options: string[];
  hasOther: boolean;
}

export const CHOICE_TYPES = new Set([2, 3, 4]);

const CACHE_MS = 60_000;
let cache: { url: string; at: number; questions: Map<string, FormQuestion> } | null = null;

// Pulls FB_PUBLIC_LOAD_DATA_ out of the form page. Items look like
// [itemId, title, description, type, [[entryId, [[option, , , , isOther], …], required]]].
export function parseFormQuestions(html: string): Map<string, FormQuestion> {
  const questions = new Map<string, FormQuestion>();
  const m = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/);
  if (!m) return questions;
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return questions;
  }
  const items = (data as unknown[][])?.[1]?.[1];
  if (!Array.isArray(items)) return questions;
  for (const item of items) {
    if (!Array.isArray(item) || typeof item[3] !== "number" || !Array.isArray(item[4])) continue;
    for (const field of item[4]) {
      if (!Array.isArray(field) || typeof field[0] !== "number") continue;
      const raw = Array.isArray(field[1]) ? (field[1] as unknown[][]) : [];
      const options: string[] = [];
      let hasOther = false;
      for (const o of raw) {
        if (!Array.isArray(o)) continue;
        if (o[4]) hasOther = true;
        else if (typeof o[0] === "string" && o[0]) options.push(o[0]);
      }
      questions.set(`entry.${field[0]}`, { type: item[3], options, hasOther });
    }
  }
  return questions;
}

export async function fetchFormQuestions(
  formResponseUrl: string,
  { fresh = false } = {},
): Promise<Map<string, FormQuestion> | null> {
  const url = formResponseUrl.replace(/\/formResponse(\?.*)?$/, "/viewform");
  if (!fresh && cache && cache.url === url && Date.now() - cache.at < CACHE_MS) return cache.questions;
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const questions = parseFormQuestions(await res.text());
    if (questions.size) cache = { url, at: Date.now(), questions };
    return questions.size ? questions : null;
  } catch {
    return null;
  }
}

function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const A = new Set(a.split(" "));
  const B = new Set(b.split(" "));
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  return common / new Set([...A, ...B]).size;
}

export interface ChoiceAnswer {
  values: string[]; // option texts, sent as-is
  other: string[]; // no matching option; sent via "Other" if the form has it
}

// Maps each of our labels to the form's option(s). A label split into
// several options at its commas maps to all of them.
export function matchOptions(labels: string[], q: FormQuestion): ChoiceAnswer {
  const values: string[] = [];
  const other: string[] = [];
  const opts = q.options.map((o) => ({ text: o, n: norm(o) }));
  for (const label of labels) {
    const n = norm(label);
    let hits = opts.filter((o) => o.n === n);
    if (!hits.length) {
      // e.g. options "Adults finals" + "absolutes & grading" for one label
      const parts = opts.filter((o) => o.n.length > 2 && ` ${n} `.includes(` ${o.n} `));
      if (parts.length) hits = parts;
    }
    if (!hits.length) {
      const within = opts.filter((o) => ` ${o.n} `.includes(` ${n} `));
      if (within.length === 1) hits = within;
    }
    if (!hits.length) {
      const best = opts
        .map((o) => ({ o, score: tokenOverlap(n, o.n) }))
        .sort((a, b) => b.score - a.score)[0];
      if (best && best.score >= 0.6) hits = [best.o];
    }
    if (hits.length) for (const h of hits) { if (!values.includes(h.text)) values.push(h.text); }
    else other.push(label);
  }
  return { values, other };
}
