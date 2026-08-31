"use client";

import { TC, fmt, tagClassFor, today, type Session } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function SessionCard({ s }: { s: Session }) {
  const { myBookings, isConfirmed, role, goto, openModal } = useStore();
  const tc = TC(s.type);
  const ib = myBookings.includes(s.id);
  const ic = isConfirmed(s.id);
  const ip = s.date < today();
  const isCoach = role === "coach";
  const tagClass = tagClassFor(s.type);

  return (
    <div className="session-card">
      <div className="session-accent" style={{ background: tc }} />
      <div className="session-body">
        <div className="session-meta">
          <span className={`tag ${tagClass}`}>{s.type}</span>
          {ip && s.booked.length > 0 && (
            <span className={`tag ${ic ? "tag-accent-2" : "tag-outline"}`} style={{ fontSize: 10 }}>
              {ic ? "Approved" : "Pending approval"}
            </span>
          )}
          <span className="session-date">
            {fmt(s.date)} · {s.time}
          </span>
        </div>
        <div className="session-title">{s.title}</div>
        <div className="session-tech">
          {s.techniques.length
            ? s.techniques.map((t) => t.name).join(" · ")
            : "Open mat — free rolling"}
        </div>
        {s.video && (
          <div style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: "var(--space-2)" }}>
            ▶ Pre-class video attached
          </div>
        )}
        <div className="session-footer">
          <div style={{ fontSize: 12, color: "color-mix(in srgb,var(--color-text) 55%,transparent)" }}>
            {s.booked.length} booked · {s.capacity - s.booked.length} spots left
          </div>
          {isCoach && (
            <button className="btn btn-secondary btn-xs" onClick={() => openModal({ kind: "session", editId: s.id })}>
              Edit
            </button>
          )}
          {ib ? (
            <span className="tag tag-accent-2">✓ Booked</span>
          ) : !isCoach ? (
            <button className="btn btn-primary btn-xs" onClick={() => openModal({ kind: "booking", sid: s.id })}>
              Book
            </button>
          ) : ip && s.booked.length > 0 && !ic ? (
            <button className="btn btn-secondary btn-xs" onClick={() => goto("approval")}>
              Approve
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
