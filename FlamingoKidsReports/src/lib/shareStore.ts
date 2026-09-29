import "server-only";
import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { normalizeReport, type ReportCard } from "./kidsReport";

// Shared reports live in Vercel Blob as reports/<id>.json. The store is
// private by default (kids' photos), so blobs are only readable through this
// app's /r/<id> page. Set BLOB_ACCESS=public if the store was created public.
// For local development or self-hosting, SHARE_DIR=<folder> stores the same
// JSON files on disk instead.

const ACCESS: "public" | "private" = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const ID_RE = /^[A-Za-z0-9]{8,16}$/;
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const SHARE_DIR = process.env.SHARE_DIR;

export function storeConfigured(): boolean {
  return !!(SHARE_DIR ||process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

export function isShareId(id: string): boolean {
  return ID_RE.test(id);
}

export function newShareId(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const path = (id: string) => `reports/${id}.json`;

export async function saveReport(id: string, report: ReportCard): Promise<void> {
  if (SHARE_DIR) {
    await mkdir(join(SHARE_DIR, "reports"), { recursive: true });
    await writeFile(join(SHARE_DIR, path(id)), JSON.stringify(report));
    return;
  }
  await put(path(id), JSON.stringify(report), {
    access: ACCESS,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

// cache(): the page and its metadata share one read per request.
export const loadReport = cache(async function loadReport(id: string): Promise<ReportCard | null> {
  if (!isShareId(id)) return null;
  try {
    if (SHARE_DIR) {
      return normalizeReport(JSON.parse(await readFile(join(SHARE_DIR, path(id)), "utf8")) as ReportCard);
    }
    const res = await get(path(id), { access: ACCESS, useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    const text = await new Response(res.stream).text();
    return normalizeReport(JSON.parse(text) as ReportCard);
  } catch {
    return null;
  }
});
