"use client";

import { useState } from "react";
import { fmt, ini, today } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Register() {
  const { sessions, members, approvalState, isConfirmed } = useStore();
  const [filter, setFilter] = useState("all");

  const t = today();
  let ss = sessions.filter((s) => s.booked.length > 0 || s.date < t);
  if (filter !== "all") ss = ss.filter((s) => s.type === filter);
  ss = ss.slice(0, 8);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Attendance register</div>
          <p className="page-sub">All members × all sessions at a glance</p>
        </div>
        <select
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "auto", padding: "6px 14px", fontSize: 12 }}
        >
          <option value="all">All types</option>
          <option>Adult</option>
          <option>Kids</option>
          <option>Open mat</option>
        </select>
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap",
          fontSize: 12,
          color: "color-mix(in srgb,var(--color-text) 55%,transparent)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="rdot dot-a">✓</div>Attended
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="rdot dot-x">✗</div>Absent
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="rdot dot-b">?</div>Booked / pending
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="rdot dot-n">–</div>Not booked
        </span>
      </div>

      <div className="register-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>Member</th>
              <th style={{ minWidth: 60, textAlign: "center", borderLeft: "1px solid var(--color-divider)" }}>Total</th>
              {ss.map((s) => (
                <th key={s.id} className="s-th" title={s.title}>
                  {fmt(s.date).split(" ").slice(0, 2).join(" ")}
                  <br />
                  <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", opacity: 0.7 }}>
                    {s.type}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const tot = ss.filter(
                (s) =>
                  s.booked.includes(m.id) &&
                  isConfirmed(s.id) &&
                  approvalState[s.id] &&
                  approvalState[s.id][m.id] !== false,
              ).length;
              return (
                <tr key={m.id}>
                  <td>
                    <div className="rmem">
                      <div className="rav">{ini(m.name)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.55 }}>{m.belt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="dc" style={{ fontSize: 12, fontWeight: 700 }}>
                    {tot}/{ss.length}
                  </td>
                  {ss.map((s) => {
                    const ib = s.booked.includes(m.id);
                    const ic = isConfirmed(s.id);
                    if (!ib) {
                      return (
                        <td key={s.id} className="dc">
                          <div className="rdot dot-n">–</div>
                        </td>
                      );
                    }
                    if (ic) {
                      const at = approvalState[s.id] && approvalState[s.id][m.id] !== false;
                      return (
                        <td key={s.id} className="dc">
                          <div className={`rdot ${at ? "dot-a" : "dot-x"}`}>{at ? "✓" : "✗"}</div>
                        </td>
                      );
                    }
                    return (
                      <td key={s.id} className="dc">
                        <div className="rdot dot-b">?</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
