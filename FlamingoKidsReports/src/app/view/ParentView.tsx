"use client";

import { useEffect, useRef, useState } from "react";
import ScaledReport from "@/components/kids/ScaledReport";
import { decodeReport, firstName, type ReportCard } from "@/lib/kidsReport";
import { downloadBlob, reportFileName, reportPng, sharePng } from "@/lib/kidsExport";
import k from "../kr.module.css";

/**
 * What parents open. `initial` is the report loaded on the server for a short
 * /r/<id> link (null when that id doesn't exist); without it the report is
 * decoded from the link's #fragment.
 */
export default function ParentView({ initial }: { initial?: ReportCard | null }) {
  const [report, setReport] = useState<ReportCard | null>(initial ?? null);
  const [error, setError] = useState(
    initial === null ? "We couldn't find this report. Please ask your coach to send the link again." : "",
  );
  const [busy, setBusy] = useState(false);
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initial !== undefined) return;
    const load = () => {
      const data = new URLSearchParams(window.location.hash.slice(1)).get("r");
      if (!data) {
        setError("This link doesn't contain a report. Please ask your coach to send it again.");
        return;
      }
      decodeReport(data)
        .then((r) => {
          setReport(r);
          setError("");
          document.title = `${firstName(r.name)}'s Jiu-Jitsu Journey · Flamingo Jiu-Jitsu`;
        })
        .catch(() => setError("This report link looks incomplete. Please ask your coach to send it again."));
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [initial]);

  async function save(share: boolean) {
    if (!node.current || !report) return;
    setBusy(true);
    try {
      const blob = await reportPng(node.current);
      if (!(share && (await sharePng(blob, report)))) downloadBlob(blob, reportFileName(report));
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) alert("Sorry, the image couldn't be created.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className={k.viewer}><p className={k.message}>{error}</p></div>;
  if (!report) return <div className={k.viewer} />;

  return (
    <div className={k.viewer}>
      <div className={`${k.viewerBar} ${k.noPrint}`}>
        <div className={k.viewerTitle}>{firstName(report.name)}&apos;s Jiu-Jitsu Journey 🦩</div>
        <div className={k.actions}>
          <button className={`${k.btn} ${k.primary}`} disabled={busy} onClick={() => save(false)}>
            {busy ? "Preparing…" : "Save image"}
          </button>
          <button className={k.btn} disabled={busy} onClick={() => save(true)}>
            Share
          </button>
          <button className={k.btn} onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </div>
      <div className={k.reportFrame}>
        <ScaledReport ref={node} report={report} />
      </div>
    </div>
  );
}
