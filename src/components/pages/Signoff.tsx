"use client";

import { fmt, ini } from "@/lib/data";
import { useStore } from "@/lib/store";
import { IconInfo } from "../icons";

export default function Signoff() {
  const { PD, members, grantSO, denySO } = useStore();

  const items = Object.entries(PD)
    .filter(([, v]) => v.level === 3)
    .map(([k, v]) => {
      const parts = k.split(/_(.+)/);
      const mid = parseInt(parts[0], 10);
      const tn = parts[1];
      const m = members.find((x) => x.id === mid);
      return { mid, tn, m, upd: v.updatedAt };
    })
    .filter((x): x is { mid: number; tn: string; m: NonNullable<typeof x.m>; upd: string } => Boolean(x.m));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Sign-off queue</div>
          <p className="page-sub">Members who self-rated “Can apply” — awaiting coach verification</p>
        </div>
      </div>

      {!items.length ? (
        <div className="empty">
          No members ready for sign-off yet.
          <br />
          They appear here after self-rating a technique as “Can apply”.
        </div>
      ) : (
        <>
          <div className="info-banner blue">
            <IconInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Observe these members in rolling, then tap <strong>Sign off</strong> to confirm Level 4, or{" "}
              <strong>Not yet</strong> to send back for more drilling.
            </span>
          </div>
          {items.map((it) => (
            <div className="sq-row" key={it.mid + "_" + it.tn}>
              <div className="att-avatar">{ini(it.m.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)" }}>{it.m.name}</div>
                <div style={{ fontSize: 11, opacity: 0.55 }}>
                  {it.m.belt} · reported {fmt(it.upd)}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-heading)", minWidth: 130 }}>
                {it.tn}
              </div>
              <span className="prof-badge prof-3">Can apply</span>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className="btn btn-primary btn-sm" onClick={() => grantSO(it.mid, it.tn)}>
                  Sign off
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => denySO(it.mid, it.tn)}>
                  Not yet
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
