"use client";

import { forwardRef, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { TRAIT_LEVELS, type ReportCard } from "@/lib/kidsReport";
import { display, round } from "./fonts";
import s from "./report.module.css";

/** Shrinks its text until it fits the box (long names, chatty notes). */
function Fit({
  children,
  className,
  style,
  max,
  min = 12,
  singleLine = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max: number;
  min?: number;
  singleLine?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Right-aligned overflow spills left and doesn't count in scrollWidth, so
    // single lines are measured by their inner span instead.
    const inner = el.firstElementChild as HTMLElement | null;
    const overflows = () =>
      singleLine
        ? (inner?.offsetWidth ?? 0) > el.clientWidth + 1
        : el.scrollHeight > el.clientHeight + 1;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (overflows() && size > min) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    // Measure again once the web fonts have arrived.
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
    };
  });
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, fontSize: max, whiteSpace: singleLine ? "nowrap" : undefined }}
    >
      {singleLine ? <span style={{ display: "inline-block", width: "max-content" }}>{children}</span> : children}
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

function Logo() {
  return (
    <div className={s.logo}>
      <div className={s.logoIcon} />
      <div className={s.logoWord} />
    </div>
  );
}

function Badge({ text }: { text: string }) {
  const label = text.trim().toUpperCase() || "BADGE";
  // Arc from the left shoulder over the top to the right shoulder.
  const size = Math.max(28, Math.min(58, 560 / Math.max(label.length, 6)));
  return (
    <svg className={s.badgeSvg} viewBox="0 0 375 222" aria-label={`${text} badge`}>
      <defs>
        <path id="badge-arc" d="M 95 175 A 98 98 0 1 1 280 175" />
      </defs>
      <path
        d="M187 22 C 225 40 262 44 290 42 L 290 118 C 290 170 250 196 187 214 C 124 196 84 170 84 118 L 84 42 C 112 44 149 40 187 22 Z"
        fill="#9fb8ba"
        stroke="#f4f0e2"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path
        d="M187 34 C 222 50 255 54 280 52 L 280 118 C 280 164 244 188 187 204 C 130 188 94 164 94 118 L 94 52 C 119 54 152 50 187 34 Z"
        fill="#fbf8ef"
      />
      <image href="/flamingo-icon-teal.png" x="160" y="118" width="54" height="47" />
      <text x="187" y="182" textAnchor="middle" fontFamily={round.style.fontFamily} fontSize={9} fill="#2b938f">
        flamingo
      </text>
      <text x="187" y="191" textAnchor="middle" fontFamily={round.style.fontFamily} fontSize={9} fill="#2b938f">
        jiu-jitsu
      </text>
      <text fontFamily={display.style.fontFamily} fontSize={size} fill="#1c5f5a" letterSpacing="0.02em">
        <textPath href="#badge-arc" startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </svg>
  );
}

const ReportCardView = forwardRef<HTMLDivElement, { report: ReportCard }>(function ReportCardView(
  { report: r },
  ref,
) {
  const powers = r.superpowers.slice(0, 4);
  return (
    <div ref={ref} className={s.page}>
      <Logo />

      <div className={s.title}>
        <div className={s.brush}>
          MY JIU-JITSU
          <br />
          JOURNEY
        </div>
        <div className={s.period}>{r.period}</div>
      </div>

      <div className={s.who}>
        <div className={s.group}>{r.group}</div>
        <Fit className={`${s.brush} ${s.name}`} max={74} min={30} singleLine>
          {r.name.toUpperCase()}
        </Fit>
        <div className={s.batch}>{r.batch}</div>
      </div>

      <div className={s.photoWrap}>
        <div className={s.photoCircle} />
        {r.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.photo} src={r.photo} alt={r.name} />
        ) : (
          <div className={s.photoInitial}>{r.name.trim()[0]?.toUpperCase() ?? ""}</div>
        )}
      </div>

      {/* MY SUPERPOWERS */}
      <section className={`${s.card} ${s.powers}`}>
        <div className={`${s.tab} ${s.tabBig} ${s.tabYellow}`}>
          <span className={s.emoji}>⭐</span> MY SUPERPOWERS
        </div>
        <div className={s.powerGrid}>
          {powers.map((p, i) => (
            <div key={i} className={s.power}>
              <div className={s.powerHead}>
                <span className={s.emoji}>{p.emoji}</span>
                <span>{p.title}</span>
              </div>
              <Fit className={s.powerText} max={23} min={14}>
                {p.text}
              </Fit>
            </div>
          ))}
        </div>
      </section>

      {/* MY FLAMINGO TRAITS */}
      <section className={`${s.card} ${s.traits}`}>
        <div className={`${s.tab} ${s.tabBig} ${s.tabMint}`}>
          <span className={s.emoji}>🌱</span> MY FLAMINGO TRAITS
        </div>
        <div className={s.traitRows}>
          {r.traits.map((t) => (
            <div key={t.name} className={s.traitRow}>
              <div className={s.traitName}>{t.name}</div>
              {TRAIT_LEVELS.map((l) => (
                <div key={l.level} className={`${s.traitIcon} ${t.level === l.level ? s.on : ""}`}>
                  <span className={s.emoji}>{l.emoji}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={s.legend}>
          {TRAIT_LEVELS.map((l) => (
            <span key={l.level}>
              <span className={s.emoji}>{l.emoji}</span> {l.label}
            </span>
          ))}
        </div>
      </section>

      {/* MY JOURNEY */}
      <section className={`${s.card} ${s.journey}`}>
        <Fit className={s.body} max={23} min={14}>
          <Paragraphs text={r.journey} />
        </Fit>
      </section>
      <div className={`${s.tab} ${s.tabSmall} ${s.tabBlue} ${s.journeyTab}`}>MY JOURNEY – THEN AND NOW!</div>

      {/* NEXT LEVEL */}
      <section className={`${s.card} ${s.next}`}>
        <Fit className={s.body} max={23} min={14}>
          <Paragraphs text={r.nextLevel} />
        </Fit>
      </section>
      <div className={`${s.tab} ${s.tabSmall} ${s.tabLilac} ${s.nextTab}`}>NEXT LEVEL: WHAT ARE WE WORKING ON?</div>

      {/* BADGE */}
      <section className={s.badgeBox}>
        <Badge text={r.badge} />
      </section>
      <div className={`${s.tab} ${s.tabSmall} ${s.tabBlue} ${s.badgeTab}`}>BADGE UNLOCKED</div>

      {/* COACH'S NOTE */}
      <section className={`${s.card} ${s.note}`}>
        <Fit className={s.body} max={23} min={14}>
          <Paragraphs text={r.coachNote} />
        </Fit>
      </section>
      <div className={`${s.tab} ${s.tabSmall} ${s.tabMint} ${s.noteTab}`}>COACH&apos;S NOTE</div>

      <div className={s.footer}>FLAMINGO JIU-JITSU</div>
    </div>
  );
});

export default ReportCardView;
