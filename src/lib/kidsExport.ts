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

/** A self-contained link: the whole report lives in the URL fragment. */
export async function shareLink(r: ReportCard): Promise<string> {
  const compact: ReportCard = { ...r, photo: await shrinkPhoto(r.photo) };
  return `${window.location.origin}/kids-reports/view#r=${await encodeReport(compact)}`;
}

export function whatsappText(r: ReportCard, link: string): string {
  return `Hi! Here is ${firstName(r.name)}'s Jiu-Jitsu Journey report from Flamingo Jiu-Jitsu (${r.period}) 🦩\n${link}`;
}
