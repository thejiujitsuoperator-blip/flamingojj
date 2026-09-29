import "server-only";
import { cache } from "react";
import { normalizeReport, type ReportCard } from "./kidsReport";
import { getJson, putJson } from "./storage";

// Shared parent reports: reports/<id>.json, readable through /r/<id>.

const ID_RE = /^[A-Za-z0-9]{8,16}$/;
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isShareId(id: string): boolean {
  return ID_RE.test(id);
}

export function newShareId(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const path = (id: string) => `reports/${id}.json`;

export async function saveReport(id: string, report: ReportCard): Promise<void> {
  await putJson(path(id), report);
}

// cache(): the page and its metadata share one read per request.
export const loadReport = cache(async function loadReport(id: string): Promise<ReportCard | null> {
  if (!isShareId(id)) return null;
  try {
    const r = await getJson<ReportCard>(path(id));
    return r && normalizeReport(r);
  } catch {
    return null;
  }
});
