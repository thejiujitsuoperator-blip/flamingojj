"use client";

import { CAT_COLOR, ME, TC, fmt, today, type Session } from "@/lib/data";
import { useStore } from "@/lib/store";
import { IconArrowRight, IconTicket } from "../icons";

function MiniCard({ s }: { s: Session }) {
  const { myBookings } = useStore();
  const tc = TC(s.type);
  const ib = myBookings.includes(s.id);
  return (
    <div className="card elev-sm" style={{ marginBottom: "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
        <div style={{ width: 8, height: 8, borderRadius: 999, background: tc, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "color-mix(in srgb,var(--color-text) 55%,transparent)" }}>
          {fmt(s.date)} · {s.time}
        </span>
        {ib && (
          <span className="tag tag-accent-2" style={{ marginLeft: "auto", fontSize: 10 }}>
            Booked
          </span>
        )}
      </div>
      <div className="card-title" style={{ fontSize: 15, marginBottom: "var(--space-1)" }}>
        {s.title}
      </div>
      <div style={{ fontSize: 12, color: "color-mix(in srgb,var(--color-text) 55%,transparent)" }}>
        {s.techniques.map((t) => t.name).join(" · ") || "Open mat"}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role, members, sessions, library, PD, TA, badges, goto, openModal } = useStore();
  const coach = role === "coach";
  const me = members.find((x) => x.id === ME)!;
  const t = today();
  const upcoming = sessions.filter((s) => s.date >= t).slice(0, 2);
  const recent = [...library].reverse().slice(0, 5);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">{coach ? "Good evening, Coach 🦩" : "Good evening, Ana 🦩"}</div>
          <p className="page-sub">Flamingo BJJ · Wednesday session</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => goto(coach ? "sessions" : "book")}
        >
          {coach ? <IconArrowRight /> : <IconTicket />}
          {coach ? "New session" : "Book a class"}
        </button>
      </div>

      <div className="stats">
        {coach ? (
          <>
            <div className="stat" onClick={() => goto("members")} style={{ cursor: "pointer" }}>
              <div className="card-kicker">Members</div>
              <div className="stat-val">58</div>
              <div className="stat-lbl">Active this month</div>
            </div>
            <div className="stat">
              <div className="card-kicker">Sessions</div>
              <div className="stat-val">{sessions.filter((s) => s.date >= t).length}</div>
              <div className="stat-lbl">Upcoming</div>
            </div>
            <div className="stat" onClick={() => goto("approval")} style={{ cursor: "pointer" }}>
              <div className="card-kicker">Approval</div>
              <div className="stat-val">{badges.pending}</div>
              <div className="stat-lbl">Awaiting review</div>
            </div>
            <div className="stat" onClick={() => goto("signoff")} style={{ cursor: "pointer" }}>
              <div className="card-kicker">Sign-off</div>
              <div className="stat-val">{badges.signoff}</div>
              <div className="stat-lbl">Ready to verify</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat">
              <div className="card-kicker">Streak</div>
              <div className="stat-val">{me.streak}</div>
              <div className="stat-lbl">Weeks</div>
            </div>
            <div className="stat">
              <div className="card-kicker">Classes</div>
              <div className="stat-val">{me.classes}</div>
              <div className="stat-lbl">Attended</div>
            </div>
            <div className="stat">
              <div className="card-kicker">Techniques</div>
              <div className="stat-val">{TA.filter((ta) => ta.mid === ME).length}</div>
              <div className="stat-lbl">Logged</div>
            </div>
            <div className="stat">
              <div className="card-kicker">Mastered</div>
              <div className="stat-val">
                {Object.keys(PD).filter((k) => k.startsWith(ME + "_") && PD[k].level >= 3).length}
              </div>
              <div className="stat-lbl">Can apply +</div>
            </div>
          </>
        )}
      </div>

      <div className="grid2">
        <div>
          <div className="sec-head">
            <div className="sec-title">Upcoming sessions</div>
            <span
              style={{ fontSize: 12, color: "var(--color-accent)", cursor: "pointer" }}
              onClick={() => goto("book")}
            >
              View all →
            </span>
          </div>
          {upcoming.length ? (
            upcoming.map((s) => <MiniCard key={s.id} s={s} />)
          ) : (
            <div className="empty">No upcoming sessions</div>
          )}
        </div>
        <div>
          <div className="sec-head">
            <div className="sec-title">Recent techniques</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {recent.map((tech) => (
              <div
                key={tech.id}
                className="tech-row"
                onClick={() => openModal({ kind: "tech", id: tech.id })}
                style={{ padding: "var(--space-2) var(--space-3)" }}
              >
                <div
                  className="tech-dot"
                  style={{ background: CAT_COLOR[tech.cat], width: 8, height: 8 }}
                />
                <div className="tech-name" style={{ fontSize: 12 }}>
                  {tech.name}
                </div>
                <div className="tag tag-neutral" style={{ fontSize: 10 }}>
                  {tech.cat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
