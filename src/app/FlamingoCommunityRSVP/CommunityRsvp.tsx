"use client";

import { useState, useSyncExternalStore } from "react";
import {
  MAX_GUESTS,
  SESSIONS,
  firstName,
  guestsText,
  sessionsText,
  validateRsvp,
  type RsvpErrors,
} from "@/lib/rsvp";
import s from "./rsvp.module.css";

const INVITE_BASE =
  "You're invited to Flamingo Jiu-Jitsu's Community Day — Sat, Oct 11 @ HSR Layout.\nFree Movement & Self-Defense Workshop at 10am (no experience needed), plus kids & adults competitions, meet & greet, and food all day.\nCome roll with us!";

// The page's own address, so invites point back to wherever it's hosted.
// Empty during server render; filled in on the client.
const noSubscribe = () => () => {};
function useRsvpUrl(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => window.location.origin + window.location.pathname,
    () => "",
  );
}

type WhatsAppStatus = "sent" | "failed" | "not_configured";

function ChatIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.5 9.5c.3 2.6 2.4 4.7 5 5" />
    </svg>
  );
}

export default function CommunityRsvp() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<RsvpErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsapp, setWhatsapp] = useState<WhatsAppStatus | null>(null);
  const [note, setNote] = useState("");

  const input = { name, phone, guests, sessions: selected };
  const errors: RsvpErrors = showErrors ? { ...serverErrors, ...validateRsvp(input) } : {};
  const count = selected.length;
  const locked = submitted || submitting;

  const toggleSession = (key: string) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  async function submit() {
    if (locked) return;
    setSubmitError("");
    setServerErrors({});
    if (Object.keys(validateRsvp(input)).length) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setWhatsapp(data.whatsapp ?? null);
        setSubmitted(true);
      } else if (data.errors) {
        setServerErrors(data.errors);
        setShowErrors(true);
      } else {
        setSubmitError(data.error ?? "Something went wrong — please try again.");
      }
    } catch {
      setSubmitError("Couldn’t reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const rsvpUrl = useRsvpUrl();
  const invite = rsvpUrl ? `${INVITE_BASE}\n\nRSVP here (takes 30 seconds): ${rsvpUrl}` : INVITE_BASE;
  const previewMessage = note ? `${note}\n\n${invite}` : invite;
  const whatsappShareLink = `https://wa.me/?text=${encodeURIComponent(previewMessage)}`;

  return (
    <div className={s.page}>
      <div className={s.nav}>
        <div className={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flamingo-icon.png" alt="Flamingo Jiu-Jitsu icon" className={s.brandIcon} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flamingo-wordmark.png" alt="Flamingo Jiu-Jitsu" className={s.brandWordmark} />
        </div>
        <div className={s.datePill}>SAT, OCT 11 · HSR LAYOUT</div>
      </div>

      {/* primary CTA: RSVP */}
      <section id="rsvp" className={s.section} style={{ paddingTop: 24 }}>
        <div className={s.card}>
          <div className={s.tag}>RSVP — TAKES 30 SECONDS</div>
          <h1 className={s.cardTitle}>Are you coming?</h1>
          <p className={s.cardLede}>Let us know so we can plan the mats, the merch and the food.</p>

          {!submitted ? (
            <form
              className={s.form}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className={s.field}>
                <label htmlFor="rsvp-name" className={s.label}>Your name</label>
                <input id="rsvp-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={s.input} disabled={submitting} />
                {errors.name && <div role="alert" className={s.error}>{errors.name}</div>}
              </div>

              <div className={s.field}>
                <label htmlFor="rsvp-phone" className={s.label}>WhatsApp number</label>
                <input id="rsvp-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" className={s.input} disabled={submitting} />
                {errors.phone && <div role="alert" className={s.error}>{errors.phone}</div>}
              </div>

              <div className={s.field} style={{ gap: 8 }}>
                <div id="rsvp-guests-label" className={s.label}>How many guests are coming with you?</div>
                <div role="group" aria-labelledby="rsvp-guests-label" className={s.stepper}>
                  <button type="button" aria-label="Fewer guests" className={s.stepBtn} onClick={() => setGuests((g) => Math.max(0, g - 1))} disabled={submitting}>&minus;</button>
                  <div aria-live="polite" className={s.stepValue}>{guests}</div>
                  <button type="button" aria-label="More guests" className={s.stepBtn} onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} disabled={submitting}>+</button>
                </div>
                <div className={s.hint}>Not counting yourself — leave it at 0 if it&apos;s just you.</div>
              </div>

              <div className={s.field}>
                <div className={s.label}>Sessions you&apos;re attending</div>
                <div className={s.muted}>
                  {count === 0 ? "None selected yet" : `${sessionsText(count)} selected`} ·{" "}
                  <a href="#timeline" className={s.strongLink}>Choose in “How the day flows” ↓</a>
                </div>
                {errors.sessions && <div role="alert" className={s.error}>{errors.sessions}</div>}
              </div>

              <div className={s.field} style={{ gap: 10, alignItems: "flex-start" }}>
                <button type="submit" className={s.primaryBtn} disabled={submitting}>
                  {submitting ? "Sending…" : "Submit RSVP"}
                </button>
                {submitError && <div role="alert" className={s.error}>{submitError}</div>}
                <div className={s.hint}>We&apos;ll send your confirmation on WhatsApp and only use your number to reach you about Community Day.</div>
              </div>
            </form>
          ) : (
            <div className={s.thanks}>
              <div className={s.thanksTitle}>Thanks, {firstName(name)} — you&apos;re RSVP&apos;d!</div>
              <div className={s.thanksSummary}>{guestsText(guests)} · {sessionsText(count)}</div>
              {whatsapp === "sent" && (
                <div className={s.muted}>We&apos;ve sent a confirmation to your WhatsApp.</div>
              )}
              <div className={s.muted}>See you Oct 11, doors open at 9:45am. Know someone else who&apos;d love this? The workshop is free — bring them along.</div>
              <a href="#invite" className={s.primaryBtn}>Invite a friend to the workshop</a>
            </div>
          )}
        </div>
      </section>

      {/* hero */}
      <section className={s.hero}>
        <svg width="100%" height="220" viewBox="0 0 720 220" className={s.heroBg} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle cx="90" cy="60" r="90" fill="#FFF3F9" />
          <circle cx="640" cy="40" r="70" fill="#FFE1F1" />
          <circle cx="600" cy="180" r="100" fill="#FDD9EC" />
        </svg>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className={s.heroTitle}>You&apos;re part of the family —<br />come celebrate with us.</h2>
          <p className={s.heroLede}>One day, one mat, one community. Kids and adults competing, coaches and athletes mingling, and everyone welcome — whether you&apos;ve been training for years or you&apos;re just curious what jiu-jitsu is about.</p>
        </div>
      </section>

      {/* timeline */}
      <section id="timeline" className={s.section} style={{ paddingTop: 56 }}>
        <h2 className={s.sectionTitle}>How the day flows</h2>
        <p className={s.sectionLede}>Tick the sessions you&apos;ll attend — drop in for one part or stay all day, nothing is mandatory.</p>
        <div>
          {SESSIONS.map((d) => {
            const on = selected.includes(d.key);
            return (
              <div key={d.key} className={s.stop}>
                <div className={s.rail}>
                  <div className={s.dot} style={{ background: d.highlight ? "#FF87C9" : "#FBD6E7" }} />
                  <div className={s.line} />
                </div>
                <div style={{ paddingBottom: 28 }}>
                  <div className={s.stopTime}>{d.time}</div>
                  <div className={s.stopTitle}>{d.title}</div>
                  <div className={s.stopDesc}>{d.desc}</div>
                  <label htmlFor={`session-${d.key}`} className={`${s.attend} ${on ? s.attendOn : ""}`} style={{ cursor: locked ? "default" : "pointer" }}>
                    <input id={`session-${d.key}`} type="checkbox" checked={on} disabled={locked} onChange={() => toggleSession(d.key)} />
                    I&apos;m attending
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* invite composer */}
      <section id="invite" className={s.section} style={{ paddingTop: 40 }}>
        <h2 className={s.sectionTitle}>Bring someone along</h2>
        <p className={s.sectionLede} style={{ marginBottom: 20 }}>Add a personal note and share an invite on WhatsApp — a message from you means a lot more than a flyer.</p>
        <div className={s.invite}>
          <label htmlFor="note" className={s.label}>Your personal note (optional)</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Hey! You always said you wanted to try this — come with me on Saturday?" className={s.textarea} />
          <div className={s.preview}>{previewMessage}</div>
          <a href={whatsappShareLink} target="_blank" rel="noopener noreferrer" className={s.primaryBtn} style={{ alignSelf: "flex-start" }}>
            <ChatIcon stroke="#FBF6F3" />
            Share Invite
          </a>
        </div>
      </section>

      {/* support */}
      <section className={s.section} style={{ paddingTop: 56 }}>
        <h2 className={s.sectionTitle}>Support Flamingo</h2>
        <p className={s.sectionLede} style={{ marginBottom: 22 }}>Small things that go a long way for us.</p>
        <div className={s.supportGrid}>
          <a href="https://www.flamingojiujitsu.com/category/thc-x-flamingo-drop" target="_blank" rel="noopener noreferrer" className={s.supportCard}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C2006A" strokeWidth="2" aria-hidden="true"><path d="M20 7l-1 12H5L4 7" /><path d="M2 7h20l-2-4H4Z" /><path d="M12 11v4" /></svg>
            <span className={s.supportLabel}>Buy merch</span>
          </a>
          <a href="https://g.page/r/CaRdkCQibdH6EBE/review" target="_blank" rel="noopener noreferrer" className={s.supportCard}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C2006A" strokeWidth="2" aria-hidden="true"><path d="M12 17.3 6.2 20l1.1-6.5L2.5 9l6.6-1L12 2l2.9 6 6.6 1-4.8 4.5 1.1 6.5z" /></svg>
            <span className={s.supportLabel}>Leave a Google review</span>
          </a>
          <a href="https://www.instagram.com/flamingo.jiujitsu/?hl=en" target="_blank" rel="noopener noreferrer" className={s.supportCard}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C2006A" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
            <span className={s.supportLabel}>Follow us on Instagram</span>
          </a>
          <a href="https://www.youtube.com/@FlamingoJiu-Jitsu" target="_blank" rel="noopener noreferrer" className={s.supportCard}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C2006A" strokeWidth="2" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="#C2006A" stroke="none" /></svg>
            <span className={s.supportLabel}>Subscribe on YouTube</span>
          </a>
          <a href="https://chat.whatsapp.com/KsdlzuztlvC3dOhDvOKUoG?s=cl&p=a&mlu=4&ilr=4" target="_blank" rel="noopener noreferrer" className={`${s.supportCard} ${s.supportWide}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C2006A" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 9.5c.3 2.6 2.4 4.7 5 5" /></svg>
            <span>
              <span className={s.supportLabel} style={{ display: "block" }}>Join the Flamingo WhatsApp Community</span>
              <span className={s.hint} style={{ display: "block", fontSize: 13, marginTop: 2 }}>Event updates, training tips and community chatter — all in one place.</span>
            </span>
          </a>
        </div>
      </section>

      {/* bottom CTA: RSVP */}
      <section className={s.section} style={{ paddingTop: 56 }}>
        <div className={s.card} style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          {!submitted ? (
            <>
              <div className={s.tag} style={{ marginBottom: 0 }}>LAST CALL</div>
              <h2 className={s.cardTitle} style={{ fontSize: 24, margin: 0 }}>Haven&apos;t RSVP&apos;d yet?</h2>
              <p className={s.muted} style={{ margin: 0 }}>It takes 30 seconds — let us know you&apos;re coming.</p>
              <a href="#rsvp" className={s.primaryBtn} style={{ marginTop: 6 }}>RSVP now</a>
            </>
          ) : (
            <>
              <h2 className={s.cardTitle} style={{ fontSize: 22, margin: 0 }}>You&apos;re RSVP&apos;d — see you Oct 11!</h2>
              <p className={s.muted} style={{ margin: 0 }}>Know someone else who&apos;d love this? The workshop is free — bring them along.</p>
              <a href="#invite" className={s.primaryBtn} style={{ marginTop: 6 }}>Invite a friend to the workshop</a>
            </>
          )}
        </div>
      </section>

      {/* footer */}
      <footer className={s.section} style={{ paddingTop: 56, textAlign: "center" }}>
        <div className={s.rule} />
        <div className={s.footTitle}>See you on the mat, Oct 11.</div>
        <div className={s.hint} style={{ fontSize: 13, marginBottom: 20 }}>9:45am doors open</div>
        <a href="https://maps.app.goo.gl/Tkn43vwU8J89QMBD6" target="_blank" rel="noopener noreferrer" className={s.directions}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E2724" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          Get Directions to Flamingo
        </a>
        <div className={s.site}>flamingojiujitsu.com</div>
      </footer>
    </div>
  );
}
