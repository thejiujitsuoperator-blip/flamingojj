"use client";

import { useMemo, useState } from "react";
import { CAT_COLOR, ini, type SessionTechnique, type TechCat } from "@/lib/data";
import { useStore } from "@/lib/store";
import { IconLock } from "../icons";
import Backdrop from "./Backdrop";

const TECH_CATS: TechCat[] = ["Submission", "Guard", "Takedown", "Escape", "Kids"];

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function SessionModal({ editId }: { editId: number | null }) {
  const { sessions, members, isConfirmed, saveSession, closeModal, showToast } = useStore();
  const editing = sessions.find((s) => s.id === editId);
  const locked = editId != null && isConfirmed(editId);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [date, setDate] = useState(editing?.date ?? tomorrow());
  const [time, setTime] = useState(editing?.time ?? "18:30");
  const [type, setType] = useState<"Adult" | "Kids" | "Open mat" | "Competition">(editing?.type ?? "Adult");
  const [capacity, setCapacity] = useState(String(editing?.capacity ?? 20));
  const [video, setVideo] = useState(editing?.video ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [techs, setTechs] = useState<SessionTechnique[]>(editing ? [...editing.techniques] : []);
  const [bookings, setBookings] = useState<number[]>(editing ? [...editing.booked] : []);

  const [techName, setTechName] = useState("");
  const [techCat, setTechCat] = useState<TechCat>("Submission");

  const availableMembers = useMemo(
    () => members.filter((m) => !bookings.includes(m.id)),
    [members, bookings],
  );
  const [addMemberId, setAddMemberId] = useState<string>("");

  const addTech = () => {
    const n = techName.trim();
    if (!n) return;
    setTechs((prev) => [...prev, { name: n, cat: techCat }]);
    setTechName("");
  };
  const rmTech = (i: number) => setTechs((prev) => prev.filter((_, idx) => idx !== i));

  const addMemberBooking = () => {
    if (locked) {
      showToast("Attendance already confirmed");
      return;
    }
    const mid = parseInt(addMemberId || String(availableMembers[0]?.id ?? ""), 10);
    if (!mid || bookings.includes(mid)) return;
    setBookings((prev) => [...prev, mid]);
    setAddMemberId("");
  };
  const rmBooking = (mid: number) => {
    if (locked) {
      showToast("Attendance already confirmed");
      return;
    }
    setBookings((prev) => prev.filter((x) => x !== mid));
  };

  const submit = () => {
    saveSession(
      {
        title,
        date,
        time,
        type,
        capacity: parseInt(capacity, 10),
        video,
        notes,
        techniques: techs,
        booked: bookings,
      },
      editId,
    );
  };

  return (
    <Backdrop dialogStyle={{ width: "min(520px,92vw)", maxHeight: "88vh", overflowY: "auto" }}>
      <div className="dialog-title">{editId ? "Edit session" : "Create session"}</div>

      <div className="grid2">
        <div className="field">
          <label>Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Time</label>
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Class type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option>Adult</option>
            <option>Kids</option>
            <option>Open mat</option>
            <option>Competition</option>
          </select>
        </div>
        <div className="field">
          <label>Capacity</label>
          <input type="text" className="input" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Session title</label>
        <input
          type="text"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Back control fundamentals"
        />
      </div>

      <div className="field">
        <label>
          Techniques <span style={{ opacity: 0.55 }}>(auto-added to library)</span>
        </label>

        {locked && (
          <div className="lock-note">
            <IconLock size={13} />
            Locked — attendance already confirmed
          </div>
        )}

        {!locked && (
          <div className="tech-builder">
            <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <input
                type="text"
                className="input"
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                placeholder="Technique name..."
                style={{ flex: 1 }}
              />
              <select
                className="input"
                value={techCat}
                onChange={(e) => setTechCat(e.target.value as TechCat)}
                style={{ width: "auto", padding: "6px 14px", fontSize: 12 }}
              >
                {TECH_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-sm" onClick={addTech}>
                + Add
              </button>
            </div>
            <div>
              {!techs.length ? (
                <div style={{ fontSize: 12, opacity: 0.5, textAlign: "center", padding: "var(--space-2)" }}>
                  No techniques added yet
                </div>
              ) : (
                techs.map((t, i) => (
                  <div className="added-tech" key={i}>
                    <div
                      className="tech-dot"
                      style={{ background: CAT_COLOR[t.cat], width: 8, height: 8, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{t.name}</span>
                    <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                      {t.cat}
                    </span>
                    <button className="rm-tech" onClick={() => rmTech(i)}>
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="field">
        <label>
          Video URL <span style={{ opacity: 0.55 }}>(optional)</span>
        </label>
        <input
          type="text"
          className="input"
          value={video}
          onChange={(e) => setVideo(e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </div>

      <div className="field">
        <label>Coach notes</label>
        <textarea
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Drill sequence, focus points..."
        />
      </div>

      {editId != null && (
        <div>
          <hr className="hr" />
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "color-mix(in srgb,var(--color-text) 60%,transparent)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              marginBottom: "var(--space-2)",
            }}
          >
            Booking list
          </div>
          <div>
            {bookings.length ? (
              bookings.map((mid) => {
                const m = members.find((x) => x.id === mid);
                if (!m) return null;
                return (
                  <div className="booking-list-item" key={mid}>
                    <div className="rav">{ini(m.name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: 11, color: "color-mix(in srgb,var(--color-text) 50%,transparent)" }}>
                      {m.belt}
                    </span>
                    {!locked ? (
                      <button
                        onClick={() => rmBooking(mid)}
                        title="Remove"
                        style={{
                          background: "none",
                          border: "none",
                          color: "color-mix(in srgb,var(--color-text) 40%,transparent)",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: 2,
                        }}
                      >
                        ✕
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, opacity: 0.5 }}>locked</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 12, opacity: 0.5, padding: "var(--space-2) 0" }}>No members booked yet</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <select
              className="input"
              value={addMemberId}
              onChange={(e) => setAddMemberId(e.target.value)}
              style={{ flex: 1 }}
            >
              {availableMembers.length ? (
                availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.belt})
                  </option>
                ))
              ) : (
                <option disabled>All members booked</option>
              )}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={addMemberBooking}>
              + Add member
            </button>
          </div>
        </div>
      )}

      <div className="dialog-actions" style={{ marginTop: "var(--space-2)" }}>
        <button className="btn btn-secondary" onClick={closeModal}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit}>
          {editId ? "Save changes" : "Publish session"}
        </button>
      </div>
    </Backdrop>
  );
}
