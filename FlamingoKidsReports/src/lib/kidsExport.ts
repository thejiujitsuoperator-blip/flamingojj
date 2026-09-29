"use client";

import { toBlob } from "html-to-image";
import { encodeReport, firstName, shrinkPhoto, type ReportCard } from "./kidsReport";

export function reportFileName(r: ReportCard): string {
  const slug = (r.name || "report").trim().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "report"}-jiu-jitsu-journey.png`;
}

/** Renders the (unscaled) report node to a crisp PNG. */
export async function reportPng(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const opts = { pixelRatio: 2, cacheBust: false, width: 1131, height: 1600 };
  // First pass warms up font/image embedding; Safari often drops them otherwise.
  await toBlob(node, opts);
  const blob = await toBlob(node, opts);
  if (!blob) throw new Error("Could not render the report");
  return blob;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Uses the phone's share sheet (WhatsApp etc.) when it can take files. */
export async function sharePng(blob: Blob, r: ReportCard): Promise<boolean> {
  const file = new File([blob], reportFileName(r), { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: `${firstName(r.name)}'s Jiu-Jitsu Journey` });
    return true;
  }
  return false;
}

export interface SharedLink {
  link: string;
  /** Short id to reuse next time (so the parent's link stays the same). */
  id?: string;
  /** True when short links aren't set up and the long link was used. */
  fallback?: boolean;
}

/**
 * Saves the report on the server and returns a short /r/<id> link. Passing
 * the kid's previous id updates that same link. If the server has no storage
 * configured, falls back to a self-contained (long) link.
 */
export async function shareLink(r: ReportCard, id?: string): Promise<SharedLink> {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, report: r }),
  });
  if (res.ok) {
    const { id: saved } = (await res.json()) as { id: string };
    return { link: `${window.location.origin}/r/${saved}`, id: saved };
  }
  if (res.status === 503) return { link: await longLink(r), fallback: true };
  throw new Error(`Share failed (${res.status})`);
}

/** A self-contained link: the whole report lives in the URL fragment. */
export async function longLink(r: ReportCard): Promise<string> {
  const compact: ReportCard = { ...r, photo: await shrinkPhoto(r.photo) };
  return `${window.location.origin}/view#r=${await encodeReport(compact)}`;
}

export function whatsappText(r: ReportCard, link: string): string {
  return `Hi! Here is ${firstName(r.name)}'s Jiu-Jitsu Journey report from Flamingo Jiu-Jitsu (${r.period}) 🦩\n${link}`;
}
