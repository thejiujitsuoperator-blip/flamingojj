"use client";

import { fmt, tagClassFor } from "@/lib/data";
import { useStore } from "@/lib/store";
import { IconCheck } from "../icons";
import Backdrop from "./Backdrop";

export default function BookingModal({ sid }: { sid: number }) {
  const { sessions, myBookings, confirmBooking, cancelBooking } = useStore();
  const s = sessions.find((x) => x.id === sid);
  if (!s) return null;
  const ib = myBookings.includes(sid);
  const tagClass = tagClassFor(s.type);

  return (
    <Backdrop>
      <div className="dialog-title" id="bm-title">
        {ib ? "Session details" : "Confirm booking"}
      </div>
      <div>
        {ib && (
          <div className="bk-banner">
            <IconCheck size={18} style={{ color: "var(--color-accent-2)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>You&apos;re booked in</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Content added to your training log</div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <span className={`tag ${tagClass}`}>{s.type}</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>
            {fmt(s.date)} · {s.time}
          </span>
        </div>
        <div className="dialog-title" style={{ marginBottom: "var(--space-3)" }}>
          {s.title}
        </div>

        {s.techniques.length > 0 && (
          <>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: "var(--space-2)" }}>Techniques covered</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
              {s.techniques.map((tech) => (
                <span className="tl-chip" key={tech.name}>
                  {tech.name}
                </span>
              ))}
            </div>
          </>
        )}

        {s.video && (
          <div
            style={{
              background: "color-mix(in srgb,var(--color-accent) 8%,transparent)",
              border: "1px solid color-mix(in srgb,var(--color-accent) 25%,transparent)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-2) var(--space-3)",
              marginBottom: "var(--space-3)",
              fontSize: 12,
              color: "var(--color-accent)",
            }}
          >
            ▶ Pre-class video — watch before you arrive
          </div>
        )}

        {s.notes && (
          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginBottom: "var(--space-3)",
              lineHeight: 1.6,
              borderLeft: "3px solid var(--color-accent-300)",
              paddingLeft: "var(--space-3)",
            }}
          >
            {s.notes}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "var(--space-3)",
            borderTop: "1px solid var(--color-divider)",
          }}
        >
          <span style={{ fontSize: 12, opacity: 0.6 }}>{s.capacity - s.booked.length} spots remaining</span>
          {!ib ? (
            <button className="btn btn-primary" onClick={() => confirmBooking(sid)}>
              Confirm booking
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => cancelBooking(sid)}>
              Cancel booking
            </button>
          )}
        </div>
      </div>
    </Backdrop>
  );
}
