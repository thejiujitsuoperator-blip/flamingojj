"use client";

import { useState } from "react";
import { CAT_COLOR } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Library() {
  const { library, openModal } = useStore();
  const [filter, setFilter] = useState("");
  const show = filter ? library.filter((t) => t.cat === filter) : library;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Technique library</div>
          <p className="page-sub">Auto-built from session topics</p>
        </div>
        <select
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "auto", padding: "6px 14px", fontSize: 12 }}
        >
          <option value="">All categories</option>
          <option>Submission</option>
          <option>Guard</option>
          <option>Takedown</option>
          <option>Escape</option>
          <option>Kids</option>
        </select>
      </div>

      <div className="tech-list">
        {show.length ? (
          show.map((t) => (
            <div key={t.id} className="tech-row" onClick={() => openModal({ kind: "tech", id: t.id })}>
              <div className="tech-dot" style={{ background: CAT_COLOR[t.cat], width: 10, height: 10 }} />
              <div>
                <div className="tech-name">{t.name}</div>
                <div className="tech-cat">{t.cat}</div>
              </div>
              <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                {t.belt}
              </span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>
                {t.sessions.length} session{t.sessions.length !== 1 ? "s" : ""}
              </span>
              {t.video && (
                <span className="tag tag-accent" style={{ fontSize: 10 }}>
                  Video
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="empty">No techniques found</div>
        )}
      </div>
    </>
  );
}
