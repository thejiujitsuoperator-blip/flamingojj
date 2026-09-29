"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ScaledReport from "@/components/kids/ScaledReport";
import {
  BADGE_PRESETS,
  BATCHES,
  GROUPS,
  SUPERPOWER_PRESETS,
  TRAIT_LEVELS,
  columnMaxima,
  emptyWorkspace,
  firstName,
  newKid,
  parseCsv,
  readEvaluation,
  resizePhoto,
  suggestTraitLevels,
  uid,
  type Kid,
  type ReportCard,
  type Superpower,
  type TraitLevel,
  type Workspace,
} from "@/lib/kidsReport";
import { downloadBlob, reportFileName, reportPng, shareLink, whatsappText } from "@/lib/kidsExport";
import k from "./kr.module.css";
import { useWorkspaceSync } from "./useWorkspaceSync";

type Tab = "notes" | "eval" | "report";
type TextField = "journey" | "nextLevel" | "coachNote";

const TEXT_FIELDS: { key: TextField; label: string; hint: string }[] = [
  { key: "journey", label: "My journey – then and now", hint: "Where they started and how far they've come." },
  { key: "nextLevel", label: "Next level: what are we working on?", hint: "Goals for the next quarter." },
  { key: "coachNote", label: "Coach's note", hint: "Written to the kid — warm and encouraging." },
];

function completeness(r: ReportCard): number {
  const checks = [
    !!r.name.trim(),
    !!r.photo,
    r.superpowers.every((p) => p.title.trim() && p.text.trim()),
    r.traits.length > 0 && r.traits.every((t) => t.level > 0),
    !!r.journey.trim(),
    !!r.nextLevel.trim(),
    !!r.badge.trim(),
    !!r.coachNote.trim(),
  ];
  return checks.filter(Boolean).length / checks.length;
}

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function CoachWorkspace() {
  const sync = useWorkspaceSync();
  const { ws, setWs } = sync;
  const [selId, setSelId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("report");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<"" | "import" | "traits">("");
  const preview = useRef<HTMLDivElement>(null);

  // Select the first kid once data arrives (or when the selected one goes away).
  useEffect(() => {
    if (ws && !ws.kids.some((x) => x.id === selId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelId([...ws.kids].sort((a, b) => a.report.name.localeCompare(b.report.name))[0]?.id ?? "");
    }
  }, [ws, selId]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const kid = ws?.kids.find((x) => x.id === selId) ?? null;
  const visible = useMemo(
    () =>
      (ws?.kids ?? [])
        .filter((x) => x.report.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.report.name.localeCompare(b.report.name)),
    [ws, query],
  );

  if (sync.mode === "login") return <SignIn onSubmit={sync.login} />;
  if (!ws || sync.mode === "loading") {
    return (
      <div className={k.ws}>
        <p className={k.message}>Loading…</p>
      </div>
    );
  }

  // ── state helpers ──
  const updateKid = (id: string, fn: (kid: Kid) => Kid) =>
    setWs((w) =>
      w ? { ...w, kids: w.kids.map((x) => (x.id === id ? { ...fn(x), updatedAt: new Date().toISOString() } : x)) } : w,
    );
  const updateReport = (patch: Partial<ReportCard>) =>
    kid && updateKid(kid.id, (x) => ({ ...x, report: { ...x.report, ...patch } }));
  const setPower = (i: number, patch: Partial<Superpower>) =>
    kid &&
    updateReport({ superpowers: kid.report.superpowers.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  function addKid() {
    const name = prompt("Kid's name");
    if (!name?.trim() || !ws) return;
    const nk = newKid(name.trim(), ws);
    setWs({ ...ws, kids: [...ws.kids, nk] });
    setSelId(nk.id);
    setTab("notes");
  }

  function removeKid() {
    if (!kid || !ws) return;
    if (!confirm(`Delete ${kid.report.name} and all their notes? This can't be undone.`)) return;
    const rest = ws.kids.filter((x) => x.id !== kid.id);
    setWs({ ...ws, kids: rest });
    setSelId(rest[0]?.id ?? "");
  }

  function setPeriod(period: string) {
    setWs((w) => (w ? { ...w, period, kids: w.kids.map((x) => ({ ...x, report: { ...x.report, period } })) } : w));
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      updateReport({ photo: await resizePhoto(file) });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not read that image");
    }
  }

  async function downloadPng() {
    if (!preview.current || !kid) return;
    setBusy(true);
    try {
      downloadBlob(await reportPng(preview.current), reportFileName(kid.report));
    } catch {
      setToast("Sorry, the image couldn't be created");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(openWhatsApp: boolean) {
    if (!kid) return;
    setBusy(true);
    // Safari only allows window.open straight after the click, so open first.
    const win = openWhatsApp ? window.open("", "_blank") : null;
    try {
      const { link, id, fallback } = await shareLink(kid.report, kid.shareId);
      if (id && id !== kid.shareId) updateKid(kid.id, (x) => ({ ...x, shareId: id }));
      if (openWhatsApp) {
        const url = `https://wa.me/?text=${encodeURIComponent(whatsappText(kid.report, link))}`;
        if (win) win.location.href = url;
        else window.location.assign(url);
      } else {
        await navigator.clipboard.writeText(link);
        setToast(
          fallback
            ? "Link copied (long version — short links need Vercel Blob, see README)"
            : "Parent link copied — paste it into WhatsApp or email",
        );
      }
    } catch {
      win?.close();
      setToast("Couldn't create the link");
    } finally {
      setBusy(false);
    }
  }

  function backup() {
    const blob = new Blob([JSON.stringify(ws, null, 1)], { type: "application/json" });
    downloadBlob(blob, `flamingo-kids-reports-${todayIso()}.json`);
  }

  function restore(file: File | undefined) {
    if (!file) return;
    file.text().then((t) => {
      try {
        const data = JSON.parse(t) as Workspace;
        if (data.version !== 1 || !Array.isArray(data.kids)) throw new Error();
        const clash = data.kids.filter((x) => ws?.kids.some((y) => y.id === x.id)).length;
        const msg =
          `Restore ${data.kids.length} kids from this backup?` +
          (clash ? ` ${clash} already here will be replaced by the backup's version.` : "") +
          " Kids not in the backup are kept.";
        if (!confirm(msg)) return;
        const ids = new Set(data.kids.map((x) => x.id));
        setWs((w) =>
          w
            ? {
                ...w,
                period: data.period ?? w.period,
                traitNames: data.traitNames ?? w.traitNames,
                kids: [...w.kids.filter((x) => !ids.has(x.id)), ...data.kids],
              }
            : w,
        );
        setToast("Backup restored");
      } catch {
        setToast("That file isn't a kids-reports backup");
      }
    });
  }

  return (
    <div className={k.ws}>
      <header className={`${k.top} ${k.noPrint}`}>
        <Link className={k.brand} href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flamingo-icon-teal.png" alt="" />
          Flamingo Kids Reports
        </Link>
        <SyncBadge status={sync.status} />
        <div className={k.grow} />
        <label className={k.label} style={{ margin: 0 }}>
          Report period&nbsp;
          <input
            className={k.input}
            style={{ width: 170, display: "inline-block" }}
            value={ws.period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </label>
        <button className={k.btn} onClick={() => setDialog("import")}>
          Import evaluation sheet
        </button>
        <button className={k.btn} onClick={() => setDialog("traits")}>
          Traits
        </button>
        <button className={k.btn} onClick={backup} title="Download everything as a file">
          Backup
        </button>
        <label className={k.btn}>
          Restore
          <input type="file" accept="application/json" hidden onChange={(e) => restore(e.target.files?.[0])} />
        </label>
        {sync.mode === "server" && (
          <button className={k.btn} onClick={() => confirm("Sign out on this device?") && sync.logout()}>
            Sign out
          </button>
        )}
      </header>
      {sync.mode === "local" && sync.localReason && (
        <div className={`${k.banner} ${k.noPrint}`}>
          {sync.localReason} Use <b>Backup</b> regularly.
        </div>
      )}
      {sync.localOffer && (
        <div className={`${k.banner} ${k.noPrint}`}>
          This browser has {sync.localOffer.kids.length} kids saved from before cloud saving was switched on.
          <button className={`${k.btn} ${k.small} ${k.primary}`} onClick={sync.acceptLocalOffer}>
            Upload them
          </button>
          <button className={`${k.btn} ${k.small}`} onClick={sync.dismissLocalOffer}>
            Not now
          </button>
        </div>
      )}

      <div className={k.layout}>
        {/* ── KIDS ── */}
        <aside className={`${k.panel} ${k.noPrint}`}>
          <div className={k.panelTitle}>
            Kids <span className={k.kidMeta}>{ws.kids.length}</span>
            <button className={`${k.btn} ${k.small} ${k.primary}`} onClick={addKid}>
              + Add
            </button>
          </div>
          <input className={k.input} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className={k.kidList}>
            {visible.map((x) => {
              const pct = completeness(x.report);
              return (
                <button
                  key={x.id}
                  className={`${k.kidItem} ${x.id === selId ? k.active : ""}`}
                  onClick={() => setSelId(x.id)}
                >
                  {x.report.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={k.avatar} src={x.report.photo} alt="" />
                  ) : (
                    <span className={k.avatar}>{x.report.name.trim()[0]?.toUpperCase()}</span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div>{x.report.name}</div>
                    <div className={k.kidMeta}>
                      {x.observations.length} notes · {Math.round(pct * 100)}% ready
                    </div>
                    <div className={k.progress}>
                      <span style={{ width: `${pct * 100}%` }} />
                    </div>
                  </span>
                </button>
              );
            })}
            {!visible.length && <p className={k.hint}>No kids yet. Add one, or import the evaluation sheet.</p>}
          </div>
        </aside>

        {/* ── EDITOR ── */}
        <main className={k.noPrint}>
          {!kid ? (
            <div className={k.panel}>
              <p className={k.hint}>Pick a kid on the left to start.</p>
            </div>
          ) : (
            <div className={k.panel}>
              <div className={k.tabs}>
                <button className={`${k.tabBtn} ${tab === "notes" ? k.on : ""}`} onClick={() => setTab("notes")}>
                  Observations
                  {kid.observations.length > 0 && <span className={k.count}>{kid.observations.length}</span>}
                </button>
                <button className={`${k.tabBtn} ${tab === "eval" ? k.on : ""}`} onClick={() => setTab("eval")}>
                  Evaluation
                </button>
                <button className={`${k.tabBtn} ${tab === "report" ? k.on : ""}`} onClick={() => setTab("report")}>
                  Report card
                </button>
              </div>

              {tab === "notes" && <Observations kid={kid} updateKid={updateKid} updateReport={updateReport} />}
              {tab === "eval" && <Evaluation kid={kid} onImport={() => setDialog("import")} />}
              {tab === "report" && (
                <>
                  <div className={k.row}>
                    <div className={k.field}>
                      <label>Name</label>
                      <input
                        className={k.input}
                        value={kid.report.name}
                        onChange={(e) => updateReport({ name: e.target.value })}
                      />
                    </div>
                    <div className={k.field}>
                      <label>Group</label>
                      <select
                        className={k.select}
                        value={kid.report.group}
                        onChange={(e) => updateReport({ group: e.target.value })}
                      >
                        {GROUPS.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className={k.field}>
                      <label>Batch</label>
                      <select
                        className={k.select}
                        value={kid.report.batch}
                        onChange={(e) => updateReport({ batch: e.target.value })}
                      >
                        {BATCHES.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={k.field}>
                    <label>Photo</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <label className={`${k.btn} ${k.small}`}>
                        {kid.report.photo ? "Change photo" : "Upload photo"}
                        <input type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
                      </label>
                      {kid.report.photo && (
                        <button className={`${k.btn} ${k.small}`} onClick={() => updateReport({ photo: "" })}>
                          Remove
                        </button>
                      )}
                      <span className={k.kidMeta}>Cropped to a circle — keep the face centred.</span>
                    </div>
                  </div>

                  <h3 className={k.panelTitle}>⭐ Superpowers</h3>
                  {kid.report.superpowers.map((p, i) => (
                    <div key={i} className={k.powerEdit}>
                      <div className={k.powerTop}>
                        <input
                          className={k.input}
                          style={{ textAlign: "center", fontSize: 20 }}
                          value={p.emoji}
                          onChange={(e) => setPower(i, { emoji: e.target.value })}
                          aria-label="Emoji"
                        />
                        <select
                          className={k.select}
                          value=""
                          onChange={(e) => {
                            const preset = SUPERPOWER_PRESETS[Number(e.target.value)];
                            if (preset) setPower(i, { ...preset });
                          }}
                        >
                          <option value="">{p.title || "Pick a superpower…"} ▾ (choose a preset)</option>
                          {SUPERPOWER_PRESETS.map((sp, j) => (
                            <option key={sp.title} value={j}>
                              {sp.emoji} {sp.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        className={k.input}
                        style={{ marginBottom: 6 }}
                        value={p.title}
                        placeholder="Title"
                        onChange={(e) => setPower(i, { title: e.target.value })}
                      />
                      <textarea
                        className={k.textarea}
                        style={{ minHeight: 60 }}
                        value={p.text}
                        placeholder="What makes this their superpower?"
                        onChange={(e) => setPower(i, { text: e.target.value })}
                      />
                    </div>
                  ))}

                  <h3 className={k.panelTitle}>🌱 Flamingo traits</h3>
                  <p className={k.hint}>🌱 starting · 🌿 growing · 🌳 strong. Tap again to clear.</p>
                  {kid.report.traits.map((t, i) => (
                    <div key={t.name} className={k.traitEdit}>
                      <span>{t.name}</span>
                      <span className={k.levelPick}>
                        {TRAIT_LEVELS.map((l) => (
                          <button
                            key={l.level}
                            title={l.label}
                            className={`${k.levelBtn} ${t.level === l.level ? k.on : ""}`}
                            onClick={() =>
                              updateReport({
                                traits: kid.report.traits.map((x, j) =>
                                  j === i ? { ...x, level: (x.level === l.level ? 0 : l.level) as TraitLevel } : x,
                                ),
                              })
                            }
                          >
                            {l.emoji}
                          </button>
                        ))}
                      </span>
                    </div>
                  ))}

                  <div style={{ height: 16 }} />
                  {TEXT_FIELDS.map((f) => (
                    <div key={f.key} className={k.field}>
                      <label>{f.label}</label>
                      <p className={k.hint} style={{ margin: "0 0 4px" }}>
                        {f.hint}
                      </p>
                      <textarea
                        className={k.textarea}
                        value={kid.report[f.key]}
                        onChange={(e) => updateReport({ [f.key]: e.target.value })}
                      />
                    </div>
                  ))}

                  <div className={k.field}>
                    <label>Badge unlocked</label>
                    <div className={k.chips} style={{ marginBottom: 6 }}>
                      {BADGE_PRESETS.map((b) => (
                        <button
                          key={b}
                          className={`${k.chip} ${kid.report.badge === b ? k.on : ""}`}
                          onClick={() => updateReport({ badge: b })}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <input
                      className={k.input}
                      value={kid.report.badge}
                      maxLength={22}
                      onChange={(e) => updateReport({ badge: e.target.value })}
                    />
                  </div>

                  <button className={`${k.btn} ${k.danger} ${k.small}`} onClick={removeKid}>
                    Delete {firstName(kid.report.name)}
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        {/* ── PREVIEW ── */}
        <section className={k.previewCol}>
          {kid && (
            <div className={k.sticky}>
              <div className={`${k.actions} ${k.noPrint}`} style={{ marginBottom: 12 }}>
                <button className={`${k.btn} ${k.primary}`} disabled={busy} onClick={downloadPng}>
                  Download PNG
                </button>
                <button className={k.btn} onClick={() => window.print()}>
                  Print / PDF
                </button>
                <button className={k.btn} disabled={busy} onClick={() => copyLink(false)}>
                  Copy parent link
                </button>
                <button className={`${k.btn} ${k.whatsapp}`} disabled={busy} onClick={() => copyLink(true)}>
                  WhatsApp
                </button>
              </div>
              <ScaledReport ref={preview} report={kid.report} />
            </div>
          )}
        </section>
      </div>

      {dialog === "import" && (
        <ImportDialog
          ws={ws}
          onClose={() => setDialog("")}
          onDone={(next, msg) => {
            setWs(next);
            if (!next.kids.some((x) => x.id === selId)) setSelId(next.kids[0]?.id ?? "");
            setDialog("");
            setToast(msg);
          }}
        />
      )}
      {dialog === "traits" && (
        <TraitsDialog
          ws={ws}
          onClose={() => setDialog("")}
          onSave={(names) => {
            setWs({
              ...ws,
              traitNames: names,
              kids: ws.kids.map((x) => ({
                ...x,
                report: {
                  ...x.report,
                  traits: names.map((n) => ({
                    name: n,
                    level: x.report.traits.find((t) => t.name === n)?.level ?? 0,
                  })),
                },
              })),
            });
            setDialog("");
          }}
        />
      )}
      {toast && <div className={k.toast}>{toast}</div>}
    </div>
  );
}

// ── OBSERVATIONS ──
function Observations({
  kid,
  updateKid,
  updateReport,
}: {
  kid: Kid;
  updateKid: (id: string, fn: (kid: Kid) => Kid) => void;
  updateReport: (patch: Partial<ReportCard>) => void;
}) {
  const [date, setDate] = useState(todayIso);
  const [coach, setCoach] = useState(() => {
    try {
      return localStorage.getItem("flamingo-coach-name") ?? "";
    } catch {
      return "";
    }
  });
  const [text, setText] = useState("");

  function add() {
    if (!text.trim()) return;
    try {
      localStorage.setItem("flamingo-coach-name", coach);
    } catch {
      /* not important */
    }
    updateKid(kid.id, (x) => ({
      ...x,
      observations: [{ id: uid(), date, coach: coach.trim(), text: text.trim() }, ...x.observations],
    }));
    setText("");
  }

  const sorted = [...kid.observations].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <p className={k.hint}>
        Jot down what you notice after each class — first days, breakthroughs, what to work on. Use these when you
        write {firstName(kid.report.name)}&apos;s report.
      </p>
      <div className={k.row2}>
        <div className={k.field}>
          <label>Date</label>
          <input type="date" className={k.input} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className={k.field}>
          <label>Coach</label>
          <input className={k.input} value={coach} placeholder="Your name" onChange={(e) => setCoach(e.target.value)} />
        </div>
      </div>
      <div className={k.field}>
        <textarea
          className={k.textarea}
          placeholder={`What did you notice about ${firstName(kid.report.name)} today?`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
        />
      </div>
      <button className={`${k.btn} ${k.primary}`} onClick={add} disabled={!text.trim()}>
        Add observation
      </button>
      <div style={{ height: 16 }} />
      {sorted.map((o) => (
        <div key={o.id} className={k.obs}>
          <div className={k.obsHead}>
            <span>
              {o.date}
              {o.coach && ` · ${o.coach}`}
            </span>
            <span>
              Add to:
              {TEXT_FIELDS.map((f) => (
                <button
                  key={f.key}
                  className={k.linkBtn}
                  onClick={() =>
                    updateReport({ [f.key]: [kid.report[f.key].trim(), o.text].filter(Boolean).join(" ") })
                  }
                >
                  {f.key === "journey" ? "journey" : f.key === "nextLevel" ? "next level" : "coach's note"}
                </button>
              ))}
              {" · "}
              <button
                className={k.linkBtn}
                onClick={() =>
                  confirm("Delete this observation?") &&
                  updateKid(kid.id, (x) => ({
                    ...x,
                    observations: x.observations.filter((y) => y.id !== o.id),
                    removedObs: [...(x.removedObs ?? []), o.id],
                  }))
                }
              >
                delete
              </button>
            </span>
          </div>
          <div className={k.obsText}>{o.text}</div>
        </div>
      ))}
      {!sorted.length && <p className={k.hint}>No observations yet.</p>}
    </>
  );
}

// ── EVALUATION ──
function Evaluation({ kid, onImport }: { kid: Kid; onImport: () => void }) {
  const entries = Object.entries(kid.evaluation);
  return (
    <>
      <p className={k.hint}>
        Scores from the Kids Evaluation sheet. Import the sheet again any time to refresh them.
      </p>
      {entries.length ? (
        <table className={k.evalTable}>
          <tbody>
            {entries.map(([item, v]) => (
              <tr key={item}>
                <td>{item}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={k.hint}>No evaluation imported for {firstName(kid.report.name)} yet.</p>
      )}
      <div style={{ height: 12 }} />
      <button className={k.btn} onClick={onImport}>
        Import evaluation sheet
      </button>
    </>
  );
}

// ── IMPORT DIALOG ──
function ImportDialog({
  ws,
  onClose,
  onDone,
}: {
  ws: Workspace;
  onClose: () => void;
  onDone: (ws: Workspace, message: string) => void;
}) {
  const [text, setText] = useState("");
  const [transpose, setTranspose] = useState(false);
  const [applyTraits, setApplyTraits] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const rows = useMemo(() => parseCsv(text), [text]);
  const parsed = useMemo(() => readEvaluation(rows, transpose), [rows, transpose]);
  const maxima = useMemo(() => columnMaxima(parsed.kids), [parsed]);

  function run() {
    let added = 0;
    let updated = 0;
    const kids = [...ws.kids];
    for (const row of parsed.kids) {
      let kid = kids.find((x) => x.report.name.trim().toLowerCase() === row.name.toLowerCase());
      if (!kid) {
        kid = newKid(row.name, ws);
        kids.push(kid);
        added++;
      } else updated++;
      const suggested = applyTraits ? suggestTraitLevels(ws.traitNames, row.scores, maxima) : {};
      const next: Kid = {
        ...kid,
        evaluation: { ...kid.evaluation, ...row.scores },
        report: {
          ...kid.report,
          traits: kid.report.traits.map((t) =>
            suggested[t.name] && (overwrite || t.level === 0) ? { ...t, level: suggested[t.name] } : t,
          ),
        },
        updatedAt: new Date().toISOString(),
      };
      kids[kids.indexOf(kid)] = next;
    }
    onDone({ ...ws, kids }, `Imported ${parsed.kids.length} kids (${added} new, ${updated} updated)`);
  }

  return (
    <div className={k.dialogBack} onClick={onClose}>
      <div className={k.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={k.panelTitle}>Import the Kids Evaluation sheet</h3>
        <p className={k.hint}>
          In Google Sheets open the <b>Kids Evaluation</b> tab, then either <b>File → Download → CSV</b> and choose
          the file below, or select all cells (Ctrl/⌘+A), copy and paste them here. Kids are matched by name; new
          names are added.
        </p>
        <label className={`${k.btn} ${k.small}`} style={{ marginBottom: 8 }}>
          Choose CSV file
          <input
            type="file"
            accept=".csv,.tsv,text/csv,text/plain"
            hidden
            onChange={(e) => e.target.files?.[0]?.text().then(setText)}
          />
        </label>
        <textarea
          className={k.textarea}
          style={{ minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
          placeholder="…or paste the cells here"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className={k.chips} style={{ margin: "10px 0" }}>
          <label className={k.chip}>
            <input type="checkbox" checked={transpose} onChange={(e) => setTranspose(e.target.checked)} /> Kids are
            in columns (not rows)
          </label>
          <label className={k.chip}>
            <input type="checkbox" checked={applyTraits} onChange={(e) => setApplyTraits(e.target.checked)} /> Suggest
            trait levels from matching items
          </label>
          {applyTraits && (
            <label className={k.chip}>
              <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Overwrite
              levels already set
            </label>
          )}
        </div>
        {parsed.kids.length > 0 && (
          <>
            <p className={k.hint} style={{ margin: 0 }}>
              Found <b>{parsed.kids.length}</b> kids and <b>{parsed.items.length}</b> assessment items.
            </p>
            <div className={k.previewBox}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    {parsed.items.map((i) => (
                      <th key={i}>{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.kids.slice(0, 50).map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      {parsed.items.map((i) => (
                        <td key={i}>{row.scores[i] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className={k.actions} style={{ justifyContent: "flex-end" }}>
          <button className={k.btn} onClick={onClose}>
            Cancel
          </button>
          <button className={`${k.btn} ${k.primary}`} disabled={!parsed.kids.length} onClick={run}>
            Import {parsed.kids.length || ""} kids
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TRAITS DIALOG ──
function TraitsDialog({
  ws,
  onClose,
  onSave,
}: {
  ws: Workspace;
  onClose: () => void;
  onSave: (names: string[]) => void;
}) {
  const [text, setText] = useState(ws.traitNames.join("\n"));
  const names = [...new Set(text.split("\n").map((s) => s.trim()).filter(Boolean))];
  return (
    <div className={k.dialogBack} onClick={onClose}>
      <div className={k.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={k.panelTitle}>Flamingo traits</h3>
        <p className={k.hint}>
          One per line — applies to every kid. Ratings are kept for traits whose name doesn&apos;t change. Six fit the
          card best.
        </p>
        <textarea className={k.textarea} style={{ minHeight: 180 }} value={text} onChange={(e) => setText(e.target.value)} />
        <div className={k.actions} style={{ justifyContent: "flex-end", marginTop: 10 }}>
          <button className={k.btn} onClick={() => setText(emptyWorkspace().traitNames.join("\n"))}>
            Reset to defaults
          </button>
          <button className={k.btn} onClick={onClose}>
            Cancel
          </button>
          <button className={`${k.btn} ${k.primary}`} disabled={!names.length} onClick={() => onSave(names)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SAVE STATUS ──
function SyncBadge({ status }: { status: "local" | "saved" | "saving" | "error" }) {
  const label = {
    local: "Saved on this device only",
    saved: "✓ All changes saved",
    saving: "Saving…",
    error: "Not saved yet — retrying",
  }[status];
  return <span className={`${k.syncBadge} ${k[`sync_${status}`]}`}>{label}</span>;
}

// ── SIGN IN ──
function SignIn({ onSubmit }: { onSubmit: (passcode: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className={k.ws}>
      <form
        className={k.signIn}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const ok = await onSubmit(code);
          setBusy(false);
          if (!ok) setError("That passcode didn't work.");
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/flamingo-icon-teal.png" alt="" width={72} height={62} />
        <h1 className={k.panelTitle} style={{ justifyContent: "center" }}>
          Flamingo Kids Reports
        </h1>
        <p className={k.hint}>Coaches only. Enter the coach passcode.</p>
        <input
          className={k.input}
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Passcode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className={k.error}>{error}</p>}
        <button className={`${k.btn} ${k.primary}`} disabled={busy || !code} style={{ marginTop: 12 }}>
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
