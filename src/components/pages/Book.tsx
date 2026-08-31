"use client";

import { useState } from "react";
import { today } from "@/lib/data";
import { useStore } from "@/lib/store";
import SessionCard from "../SessionCard";
import { IconSend } from "../icons";

export default function Book() {
  const { sessions, myBookings, requestPrivate } = useStore();
  const [focus, setFocus] = useState("Guard passing");
  const [date, setDate] = useState(today());

  const t = today();
  const av = sessions.filter((s) => s.date >= t && !myBookings.includes(s.id));
  const bk = sessions.filter((s) => myBookings.includes(s.id) && s.date >= t);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Book a class</div>
          <p className="page-sub">Upcoming sessions open for booking</p>
        </div>
      </div>

      <div>
        {bk.length > 0 && (
          <>
            <div className="sec-head">
              <div className="sec-title">Your upcoming bookings</div>
            </div>
            <div className="session-grid" style={{ marginBottom: "var(--space-6)" }}>
              {bk.map((s) => (
                <SessionCard key={s.id} s={s} />
              ))}
            </div>
          </>
        )}
        <div className="sec-head">
          <div className="sec-title">Available sessions</div>
        </div>
        {av.length ? (
          <div className="session-grid">
            {av.map((s) => (
              <SessionCard key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <div className="empty">You&apos;re all booked up!</div>
        )}
      </div>

      <div style={{ marginTop: "var(--space-8)" }}>
        <div className="sec-head">
          <div className="sec-title">Request a private session</div>
        </div>
        <div className="card elev-sm" style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
            <div style={{ fontSize: 32 }}>🥋</div>
            <div style={{ flex: 1 }}>
              <div className="card-title" style={{ marginBottom: "var(--space-1)" }}>
                1-on-1 with Coach Rodrigo
              </div>
              <p className="card-body" style={{ marginBottom: "var(--space-3)" }}>
                Choose a focus area. Coach will confirm a time within 24h.
              </p>
              <div className="grid2" style={{ gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <div className="field">
                  <label>Focus area</label>
                  <select className="input" value={focus} onChange={(e) => setFocus(e.target.value)}>
                    <option>Guard passing</option>
                    <option>Submissions</option>
                    <option>Takedowns</option>
                    <option>Escapes</option>
                    <option>Competition prep</option>
                  </select>
                </div>
                <div className="field">
                  <label>Preferred date</label>
                  <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={requestPrivate}>
                <IconSend size={13} />
                Request session
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
