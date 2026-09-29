"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./game.module.css";

// Eat the Bananas — a calm game for a two-year-old. Every key (and every tap)
// does exactly one thing: the monkey eats the next banana. Keys that can't
// sensibly be "pressed" by a toddler on purpose (held-down repeats, modifier
// keys on their own) and presses that land mid-bite do nothing at all.

const HOMES = [
  { x: 150, y: 190, r: -24 },
  { x: 275, y: 120, r: -10 },
  { x: 400, y: 95, r: 0 },
  { x: 525, y: 120, r: 10 },
  { x: 650, y: 190, r: 24 },
];
const MOUTH = { x: 400, y: 470 };

const BITE_MS = 480;
const HAPPY_MS = 1600;
const REGROW_MS = 500 + HOMES.length * 160;

// Pressing these alone never counts as a press.
const IGNORED_KEYS = new Set([
  "Shift", "Control", "Alt", "Meta", "OS", "AltGraph", "CapsLock",
  "NumLock", "ScrollLock", "Fn", "FnLock", "Hyper", "Super", "Symbol", "Dead",
  "Unidentified", "Process",
]);

type Banana = "here" | "eating" | "gone";
type Phase = "play" | "happy" | "regrow";

function useNomSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      // Two soft, low "nom" tones.
      [0, 0.16].forEach((offset, i) => {
        const t = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(i === 0 ? 330 : 294, t);
        osc.frequency.exponentialRampToValueAtTime(i === 0 ? 260 : 220, t + 0.12);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch {
      // No audio available — the game works silently.
    }
  }, []);
}

export default function BananaGame() {
  const [bananas, setBananas] = useState<Banana[]>(() => HOMES.map(() => "here"));
  const [phase, setPhase] = useState<Phase>("play");
  const [chewing, setChewing] = useState(false);
  const busy = useRef(false);
  const left = useRef(HOMES.length);
  const nom = useNomSound();

  const bite = useCallback(() => {
    if (busy.current) return;
    busy.current = true;

    const index = HOMES.length - left.current;
    left.current -= 1;
    const last = left.current === 0;

    nom();
    setChewing(true);
    setBananas((b) => b.map((v, i) => (i === index ? "eating" : v)));

    setTimeout(() => {
      setChewing(false);
      setBananas((b) => b.map((v, i) => (i === index ? "gone" : v)));
      if (!last) {
        busy.current = false;
        return;
      }
      setPhase("happy");
      setTimeout(() => {
        setPhase("regrow");
        setBananas(HOMES.map(() => "here"));
        left.current = HOMES.length;
        setTimeout(() => {
          setPhase("play");
          busy.current = false;
        }, REGROW_MS);
      }, HAPPY_MS);
    }, BITE_MS);
  }, [nom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Swallow every key so nothing scrolls, tabs away or navigates.
      e.preventDefault();
      if (e.repeat || IGNORED_KEYS.has(e.key)) return;
      bite();
    };
    const noMenu = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", noMenu);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", noMenu);
    };
  }, [bite]);

  const happy = phase === "happy";

  return (
    <main
      className={s.stage}
      role="application"
      aria-label="Eat the bananas. Press any key or tap to feed the monkey."
      onPointerDown={(e) => {
        e.preventDefault();
        bite();
      }}
    >
      <p className={s.hint}>press any key or tap</p>
      <svg className={s.scene} viewBox="0 0 800 640" aria-hidden="true">
        <ellipse cx="400" cy="720" rx="1400" ry="170" className={s.hill} />

        {bananas.map((state, i) => {
          const h = HOMES[i];
          const transform =
            state === "eating"
              ? `translate(${MOUTH.x}px, ${MOUTH.y}px) rotate(0deg) scale(0.15)`
              : `translate(${h.x}px, ${h.y}px) rotate(${h.r}deg) scale(${state === "gone" ? 0 : 1})`;
          const transition =
            state === "gone"
              ? "none"
              : state === "eating"
                ? `transform ${BITE_MS}ms ease-in, opacity ${BITE_MS}ms ease-in`
                : `transform 500ms ease-out ${phase === "regrow" ? i * 160 : 0}ms`;
          return (
            <g
              key={i}
              style={{ transform, transition, opacity: state === "eating" ? 0.2 : 1 }}
            >
              <g className={state === "here" && phase === "play" ? s.sway : undefined}>
                <path
                  d="M -64 -20 C -44 48, 44 48, 64 -20 C 40 10, -40 10, -64 -20 Z"
                  className={s.banana}
                />
                <path d="M 60 -18 L 70 -34 L 78 -30 L 67 -14 Z" className={s.stem} />
                <circle cx="-63" cy="-19" r="4" className={s.stem} />
              </g>
            </g>
          );
        })}

        <g className={happy ? s.bounce : undefined}>
          <circle cx="282" cy="400" r="40" className={s.fur} />
          <circle cx="518" cy="400" r="40" className={s.fur} />
          <circle cx="282" cy="400" r="23" className={s.face} />
          <circle cx="518" cy="400" r="23" className={s.face} />
          <circle cx="400" cy="420" r="125" className={s.fur} />
          <ellipse cx="400" cy="450" rx="95" ry="82" className={s.face} />
          <ellipse cx="360" cy="385" rx="42" ry="40" className={s.face} />
          <ellipse cx="440" cy="385" rx="42" ry="40" className={s.face} />

          {happy ? (
            <>
              <path d="M 348 392 Q 360 376 372 392" className={s.line} />
              <path d="M 428 392 Q 440 376 452 392" className={s.line} />
            </>
          ) : (
            <>
              <circle cx="360" cy="388" r="11" className={s.eye} />
              <circle cx="440" cy="388" r="11" className={s.eye} />
            </>
          )}
          <ellipse cx="335" cy="455" rx="17" ry="11" className={s.cheek} />
          <ellipse cx="465" cy="455" rx="17" ry="11" className={s.cheek} />
          <circle cx="392" cy="425" r="4" className={s.eye} />
          <circle cx="408" cy="425" r="4" className={s.eye} />

          {chewing ? (
            <ellipse cx={MOUTH.x} cy={MOUTH.y} rx="26" ry="18" className={`${s.mouth} ${s.chew}`} />
          ) : happy ? (
            <path d="M 355 458 Q 400 510 445 458 Z" className={s.mouth} />
          ) : (
            <path d="M 370 465 Q 400 485 430 465" className={s.line} />
          )}
        </g>
      </svg>
    </main>
  );
}
