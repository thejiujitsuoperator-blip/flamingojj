"use client";

import { ini } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Members() {
  const { members } = useStore();
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Members</div>
          <p className="page-sub">7 active members (demo)</p>
        </div>
      </div>

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
              <th>Member</th>
              <th>Belt</th>
              <th>Type</th>
              <th>Classes</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <div className="rav">{ini(m.name)}</div>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                  </div>
                </td>
                <td>
                  <span className="tag tag-neutral">{m.belt}</span>
                </td>
                <td style={{ opacity: 0.65 }}>{m.age}</td>
                <td style={{ fontWeight: 600 }}>{m.classes}</td>
                <td>
                  <span className="tag tag-accent-2">{m.streak} wks</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
