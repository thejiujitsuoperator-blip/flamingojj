"use client";

import { useState } from "react";
import { CAT_COLOR, ME, PL, TC, fmt, tagClassFor, today } from "@/lib/data";
import { useStore } from "@/lib/store";
import { IconX } from "../icons";

function Timeline() {
  const { sessions, myBookings, isConfirmed, approvalState, PD, goto, setProf, showToast } = useStore();
  const booked = sessions.filter((s) => myBookings.includes(s.id));
  const t = today();

  if (!booked.length) {
    return (
      <div className="empty">
        No sessions booked yet.
        <br />
        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: "var(--space-3)" }}
          onClick={() => goto("book")}
        >
          Browse sessions
        </button>
      </div>
    );
  }

  return (
    <div className="member-timeline">
      {booked.map((s) => {
        const tc = TC(s.type);
        const ip = s.date < t;
        const ic = isConfirmed(s.id);
        const at = !ic || (approvalState[s.id] && approvalState[s.id][ME] !== false);
        const tagClass = tagClassFor(s.type);

        return (
          <div className="tl-card" key={s.id}>
            <div className="tl-head">
              <div style={{ width: 8, height: 8, borderRadius: 999, background: tc, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)" }}>
                {fmt(s.date)} · {s.time}
              </span>
              <span className={`tag ${tagClass} tl-type`}>{s.type}</span>
            </div>
            <div className="tl-body">
              <div className="tl-title">{s.title}</div>
              {s.techniques.length > 0 && (
                <div className="tl-chips">
                  {s.techniques.map((tech) => (
                    <span className="tl-chip" key={tech.name}>
                      {tech.name}
                    </span>
                  ))}
                </div>
              )}
              {s.video && (
                <div style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast("Opening video...");
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ paddingLeft: 0 }}
                  >
                    ▶ Watch pre-class video
                  </a>
                </div>
              )}

              {ic && !at ? (
                <div className="no-att">
                  <IconX size={14} />
                  Marked not attended by coach
                </div>
              ) : s.techniques.length > 0 && ip ? (
                <div className="prof-row">
                  {s.techniques.map((tech) => {
                    const k = ME + "_" + tech.name;
                    const lv = (PD[k] || { level: 0 }).level;
                    return (
                      <div style={{ flex: 1 }} key={tech.name}>
                        <div
                          style={{
                            fontSize: 9,
                            opacity: 0.5,
                            marginBottom: "var(--space-1)",
                            textAlign: "center",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {tech.name.length > 14 ? tech.name.slice(0, 13) + "…" : tech.name}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {lv === 4 ? (
                            <div className="prof-btn sel-4">★ Signed off</div>
                          ) : (
                            <>
                              <div
                                className={`prof-btn ${lv === 1 ? "sel-1" : ""}`}
                                onClick={() => setProf(tech.name, tech.cat, s.title, s.date, 1, s.id)}
                              >
                                Need reps
                              </div>
                              <div
                                className={`prof-btn ${lv === 2 ? "sel-2" : ""}`}
                                onClick={() => setProf(tech.name, tech.cat, s.title, s.date, 2, s.id)}
                              >
                                Getting it
                              </div>
                              <div
                                className={`prof-btn ${lv === 3 ? "sel-3" : ""}`}
                                onClick={() => setProf(tech.name, tech.cat, s.title, s.date, 3, s.id)}
                              >
                                Can apply
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : s.techniques.length > 0 ? (
                <div style={{ fontSize: 12, opacity: 0.5, marginTop: "var(--space-2)", fontStyle: "italic" }}>
                  Rate proficiency after class
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TechTable() {
  const { TA, PD } = useStore();
  const my = TA.filter((ta) => ta.mid === ME);

  if (!my.length) return <div className="empty">No techniques logged yet</div>;

  const sorted = [...my].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <>
      <div
        style={{
          overflow: "hidden",
          borderRadius: "calc(var(--radius-lg)*1.15)",
          boxShadow: "var(--shadow-sm)",
          background: "var(--color-surface)",
        }}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Technique</th>
              <th>Category</th>
              <th>Session</th>
              <th>Date</th>
              <th>Proficiency</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ta) => {
              const lv = (PD[ME + "_" + ta.techName] || { level: 0 }).level;
              return (
                <tr key={ta.techName + "_" + ta.sid}>
                  <td style={{ fontWeight: 600 }}>{ta.techName}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className="tech-dot" style={{ background: CAT_COLOR[ta.cat], width: 8, height: 8 }} />
                      {ta.cat}
                    </div>
                  </td>
                  <td className="text-muted" style={{ fontSize: 12 }}>
                    {ta.stitle}
                  </td>
                  <td className="text-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {fmt(ta.date)}
                  </td>
                  <td>
                    <span className={`prof-badge prof-${lv}`}>{PL[lv]}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: "var(--space-3)",
          display: "flex",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          fontSize: 11,
          opacity: 0.65,
        }}
      >
        <span>
          <span className="prof-badge prof-4">Coach sign-off</span> Verified
        </span>
        <span>
          <span className="prof-badge prof-3">Can apply</span> Awaiting sign-off
        </span>
        <span>
          <span className="prof-badge prof-2">Getting it</span> Keep drilling
        </span>
        <span>
          <span className="prof-badge prof-1">Need reps</span> Revisit soon
        </span>
      </div>
    </>
  );
}

export default function MyTraining() {
  const [tab, setTab] = useState<"sessions" | "techniques">("sessions");
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">My training</div>
          <p className="page-sub">Sessions attended and techniques logged</p>
        </div>
      </div>

      <div className="tab-bar" style={{ maxWidth: 300 }}>
        <button className={`tab-btn${tab === "sessions" ? " active" : ""}`} onClick={() => setTab("sessions")}>
          Sessions
        </button>
        <button className={`tab-btn${tab === "techniques" ? " active" : ""}`} onClick={() => setTab("techniques")}>
          Techniques
        </button>
      </div>

      {tab === "sessions" ? <Timeline /> : <TechTable />}
    </>
  );
}
