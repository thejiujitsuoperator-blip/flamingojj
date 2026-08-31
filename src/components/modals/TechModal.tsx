"use client";

import { fmt } from "@/lib/data";
import { useStore } from "@/lib/store";
import Backdrop from "./Backdrop";

export default function TechModal({ id }: { id: number }) {
  const { library, sessions, closeModal } = useStore();
  const t = library.find((x) => x.id === id);
  if (!t) return null;
  const linked = sessions.filter((s) => t.sessions.includes(s.id));

  return (
    <Backdrop>
      <div className="card-kicker" style={{ marginBottom: "var(--space-1)" }}>
        {t.cat}
      </div>
      <div className="dialog-title">{t.name}</div>
      {t.video ? (
        <a
          href={t.video}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
          style={{ justifyContent: "flex-start", paddingLeft: 0 }}
        >
          ▶ Watch video
        </a>
      ) : (
        <p style={{ fontSize: 13, opacity: 0.55 }}>No video attached</p>
      )}
      <hr className="hr" />
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: "var(--space-2)",
        }}
      >
        Covered in {linked.length} session{linked.length !== 1 ? "s" : ""}
      </div>
      {linked.length ? (
        linked.map((s) => (
          <div
            key={s.id}
            style={{ fontSize: 13, padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-divider)" }}
          >
            {fmt(s.date)} · {s.title}
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, opacity: 0.5 }}>Not yet covered in a session</div>
      )}
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={closeModal}>
          Close
        </button>
      </div>
    </Backdrop>
  );
}
