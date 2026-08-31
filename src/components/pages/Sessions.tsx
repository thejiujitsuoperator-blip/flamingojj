"use client";

import { useStore } from "@/lib/store";
import SessionCard from "../SessionCard";
import { IconArrowRight } from "../icons";

export default function Sessions() {
  const { sessions, openModal } = useStore();
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Sessions</div>
          <p className="page-sub">Create and manage training sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal({ kind: "session", editId: null })}>
          <IconArrowRight />
          Create session
        </button>
      </div>
      <div className="session-grid">
        {sessions.map((s) => (
          <SessionCard key={s.id} s={s} />
        ))}
      </div>
    </>
  );
}
