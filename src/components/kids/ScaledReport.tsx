"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { ReportCard } from "@/lib/kidsReport";
import ReportCardView from "./ReportCardView";

export const PAGE_W = 1131;
export const PAGE_H = 1600;

/** The fixed-size report card, scaled down to the width of its container. */
const ScaledReport = forwardRef<HTMLDivElement, { report: ReportCard; maxWidth?: number }>(function ScaledReport(
  { report, maxWidth = PAGE_W },
  ref,
) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setScale(Math.min(el.clientWidth, maxWidth) / PAGE_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);
  return (
    <div ref={outer} className="kr-scaled" style={{ width: "100%" }}>
      <div
        className="kr-print"
        style={{
          width: PAGE_W * scale,
          height: PAGE_H * scale,
          margin: "0 auto",
          overflow: "hidden",
          boxShadow: "0 10px 34px rgba(30,40,40,.18)",
          borderRadius: 6 * scale,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAGE_W }}>
          <ReportCardView ref={ref} report={report} />
        </div>
      </div>
    </div>
  );
});

export default ScaledReport;
