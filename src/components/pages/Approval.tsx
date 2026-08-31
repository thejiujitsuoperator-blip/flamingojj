"use client";

import { TC, fmt, ini } from "@/lib/data";
import { useStore } from "@/lib/store";
import { IconInfo } from "../icons";

export default function Approval() {
  const { sessions, members, approvalState, isConfirmed, togAtt, confirmAtt, reopenApproval } = useStore();

  const rel = sessions
    .filter((s) => s.booked.length)
    .slice()
    .sort(
      (a, b) =>
        (isConfirmed(a.id) ? 1 : 0) - (isConfirmed(b.id) ? 1 : 0) ||
        +new Date(b.date) - +new Date(a.date),
    );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Attendance approval</div>
          <p className="page-sub">Confirm who showed up — updates streak and technique log</p>
        </div>
      </div>

      <div className="info-banner amber">
        <IconInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          All booked members are marked <strong>Attended</strong> by default. Uncheck no-shows then press{" "}
          <strong>Confirm attendance</strong>.
        </span>
      </div>

      {!rel.length ? (
        <div className="empty">No sessions with bookings yet</div>
      ) : (
        rel.map((s) => {
          const tc = TC(s.type);
          const ic = isConfirmed(s.id);
          const st = approvalState[s.id] || {};
          const ab = Object.values(st).filter((v) => !v).length;
          return (
            <div className="approval-card" key={s.id}>
              <div className="approval-header">
                <div style={{ width: 4, height: 40, background: tc, borderRadius: 999, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="approval-title">{s.title}</div>
                  <div className="approval-meta">
                    {fmt(s.date)} · {s.time} · {s.booked.length} booked
                  </div>
                </div>
                <span className={`tag ${ic ? "tag-accent-2" : "tag-accent"}`} style={{ fontSize: 10 }}>
                  {ic ? "Confirmed" : "Pending"}
                </span>
                {ic && (
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => reopenApproval(s.id)}
                    style={{ marginLeft: "var(--space-2)" }}
                  >
                    Reopen
                  </button>
                )}
              </div>

              <div>
                {s.booked.map((mid) => {
                  const m = members.find((x) => x.id === mid);
                  if (!m) return null;
                  const at = st[mid] !== false;
                  return (
                    <div className={`att-member-row ${at ? "" : "absent"}`} key={mid}>
                      <div className="att-avatar">{ini(m.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div className="att-name">{m.name}</div>
                        <div className="att-sub">
                          {m.belt} · {m.age}
                        </div>
                      </div>
                      <div className="att-toggle">
                        <span
                          className="toggle-label"
                          style={{ color: at ? "var(--color-accent-2)" : "var(--color-accent)" }}
                        >
                          {at ? "Attended" : "Not attended"}
                        </span>
                        <label className="tog">
                          <input
                            type="checkbox"
                            checked={at}
                            disabled={ic}
                            onChange={(e) => togAtt(s.id, mid, e.target.checked)}
                          />
                          <div className="tog-track" />
                          <div className="tog-thumb" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="approval-footer">
                <div style={{ fontSize: 12, color: "color-mix(in srgb,var(--color-text) 55%,transparent)" }}>
                  {ab ? (
                    <>
                      <strong style={{ color: "var(--color-accent)" }}>{ab}</strong> not attended
                    </>
                  ) : (
                    "All attended"
                  )}
                </div>
                {!ic ? (
                  <button className="btn btn-primary btn-sm" onClick={() => confirmAtt(s.id)}>
                    Confirm attendance
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--color-accent-2)", fontWeight: 600 }}>✓ Confirmed</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
