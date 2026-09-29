"use client";

import { type PageKey } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  IconAward,
  IconCalendar,
  IconCheckSquare,
  IconDashboard,
  IconDumbbell,
  IconGrid,
  IconSparkles,
  IconTicket,
  IconUsers,
} from "./icons";
import Link from "next/link";
import type { JSX } from "react";

interface NavEntry {
  key: PageKey;
  label: string;
  icon: JSX.Element;
  badge?: "pending" | "signoff" | "upcoming";
}

const GROUPS: { title: string; items: NavEntry[] }[] = [
  {
    title: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", icon: <IconDashboard /> }],
  },
  {
    title: "Coach tools",
    items: [
      { key: "sessions", label: "Sessions", icon: <IconCalendar /> },
      { key: "register", label: "Attendance register", icon: <IconGrid /> },
      { key: "approval", label: "Attendance approval", icon: <IconCheckSquare />, badge: "pending" },
      { key: "signoff", label: "Sign-off queue", icon: <IconAward />, badge: "signoff" },
      { key: "members", label: "Members", icon: <IconUsers /> },
      { key: "library", label: "Technique library", icon: <IconSparkles /> },
    ],
  },
  {
    title: "My training",
    items: [
      { key: "my-training", label: "My training", icon: <IconDumbbell />, badge: "upcoming" },
      { key: "book", label: "Book a class", icon: <IconTicket /> },
    ],
  },
];

export default function Sidebar() {
  const { page, goto, role, switchRole, badges } = useStore();
  const coach = role === "coach";

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">🦩</div>
        <div>
          <div className="logo-name">Flamingo BJJ</div>
          <div className="logo-tag">Training platform · Phase 1</div>
        </div>
      </div>
      <div className="role-badge">
        <div className="role-avatar">{coach ? "CR" : "AP"}</div>
        <div>
          <div className="role-name">{coach ? "Coach Rodrigo" : "Ana Pereira"}</div>
          <div className="role-type">{coach ? "Coach · Black belt" : "Member · Blue belt"}</div>
        </div>
        <div className="role-switch" onClick={switchRole}>
          switch →
        </div>
      </div>
      <nav>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="nav-group">{g.title}</div>
            {g.items.map((it) => {
              const count = it.badge ? badges[it.badge] : 0;
              return (
                <button
                  key={it.key}
                  className={`nav-item${page === it.key ? " active" : ""}`}
                  onClick={() => goto(it.key)}
                >
                  {it.icon}
                  {it.label}
                  {it.badge && count > 0 && <span className="nav-badge">{count}</span>}
                </button>
              );
            })}
            {coach && g.title === "Coach tools" && (
              <Link className="nav-item" href="/kids-reports" style={{ textDecoration: "none" }}>
                <IconAward />
                Kids reports
              </Link>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: 10, color: "color-mix(in srgb,var(--color-text) 40%,transparent)" }}>
          Organic · Phase 1 · i2
        </div>
      </div>
    </aside>
  );
}
