import "server-only";
import { del, get, list, put } from "@vercel/blob";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// JSON documents in the Vercel Blob store (private by default: kids' names and
// photos). SHARE_DIR=<folder> keeps the same files on disk instead, for local
// development or self-hosting. Set BLOB_ACCESS=public only if the store was
// created public.

const ACCESS: "public" | "private" = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const DIR = process.env.SHARE_DIR;

export function storeConfigured(): boolean {
  // A connected Blob store sets either BLOB_READ_WRITE_TOKEN or (newer
  // stores) BLOB_STORE_ID; with the latter, @vercel/blob gets its OIDC token
  // from the request at call time, so there is no token env var to check.
  return !!(DIR || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function putJson(path: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data);
  if (DIR) {
    const file = join(DIR, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
    return;
  }
  await put(path, body, {
    access: ACCESS,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

/** Returns null when the document doesn't exist. */
export async function getJson<T>(path: string): Promise<T | null> {
  if (DIR) {
    try {
      return JSON.parse(await readFile(join(DIR, path), "utf8")) as T;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  const res = await get(path, { access: ACCESS, useCache: false });
  if (!res || res.statusCode !== 200 || !res.stream) return null;
  return JSON.parse(await new Response(res.stream).text()) as T;
}

export interface Entry {
  path: string;
  /** Changes whenever the document is rewritten. */
  version: string;
}

/** Every document under `prefix` (e.g. "workspace/kids/"). */
export async function listEntries(prefix: string): Promise<Entry[]> {
  if (DIR) {
    try {
      const names = (await readdir(join(DIR, prefix))).filter((f) => f.endsWith(".json"));
      return Promise.all(
        names.map(async (f) => ({
          path: prefix + f,
          version: String((await stat(join(DIR, prefix, f))).mtimeMs),
        })),
      );
    } catch {
      return [];
    }
  }
  const out: Entry[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ path: b.pathname, version: new Date(b.uploadedAt).toISOString() })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function deleteJson(path: string): Promise<void> {
  if (DIR) {
    await rm(join(DIR, path), { force: true });
    return;
  }
  await del(path);
}
