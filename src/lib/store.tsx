"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ME,
  MIN_DAYS,
  buildInitialApproval,
  initialLibrary,
  initialMembers,
  initialPD,
  initialSessions,
  initialTA,
  today,
  type LibraryTechnique,
  type Member,
  type PageKey,
  type Proficiency,
  type Role,
  type Session,
  type SessionTechnique,
  type TechniqueActivity,
} from "./data";

// ── Modal descriptors ──
export type Modal =
  | { kind: "session"; editId: number | null }
  | { kind: "booking"; sid: number }
  | { kind: "tech"; id: number }
  | null;

export interface SessionDraft {
  title: string;
  date: string;
  time: string;
  type: Session["type"];
  capacity: number;
  video: string;
  notes: string;
  techniques: SessionTechnique[];
  booked: number[];
}

interface StoreValue {
  // state
  sessions: Session[];
  library: LibraryTechnique[];
  members: Member[];
  role: Role;
  approvalState: Record<number, Record<number, boolean>>;
  confirmed: number[];
  myBookings: number[];
  PD: Record<string, Proficiency>;
  TA: TechniqueActivity[];
  // navigation
  page: PageKey;
  goto: (page: PageKey) => void;
  // modal + toast
  modal: Modal;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  // derived
  isConfirmed: (sid: number) => boolean;
  badges: { pending: number; signoff: number; upcoming: number };
  // actions
  switchRole: () => void;
  saveSession: (draft: SessionDraft, editId: number | null) => void;
  togAtt: (sid: number, mid: number, val: boolean) => void;
  confirmAtt: (sid: number) => void;
  reopenApproval: (sid: number) => void;
  grantSO: (mid: number, tn: string) => void;
  denySO: (mid: number, tn: string) => void;
  setProf: (tn: string, cat: string, stitle: string, date: string, lv: number, sid: number) => void;
  confirmBooking: (sid: number) => void;
  cancelBooking: (sid: number) => void;
  requestPrivate: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [library, setLibrary] = useState<LibraryTechnique[]>(initialLibrary);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [role, setRole] = useState<Role>("coach");
  const [approvalState, setApprovalState] = useState<Record<number, Record<number, boolean>>>(
    () => buildInitialApproval(initialSessions),
  );
  const [confirmed, setConfirmed] = useState<number[]>([]);
  const [myBookings, setMyBookings] = useState<number[]>([1, 2]);
  const [PD, setPD] = useState<Record<string, Proficiency>>(initialPD);
  const [TA, setTA] = useState<TechniqueActivity[]>(initialTA);

  const [page, setPage] = useState<PageKey>("dashboard");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goto = useCallback((p: PageKey) => setPage(p), []);
  const openModal = useCallback((m: Modal) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const isConfirmed = useCallback((sid: number) => confirmed.includes(sid), [confirmed]);

  const switchRole = useCallback(() => {
    setRole((r) => {
      const next = r === "coach" ? "member" : "coach";
      showToast("Switched to " + (next === "coach" ? "Coach" : "Member") + " view");
      return next;
    });
  }, [showToast]);

  // ── syncLib: merge a session's techniques into the library, returns count added ──
  const syncLibInto = useCallback((lib: LibraryTechnique[], s: Session): { lib: LibraryTechnique[]; added: number } => {
    let added = 0;
    const next = lib.map((t) => ({ ...t, sessions: [...t.sessions] }));
    s.techniques.forEach((t) => {
      const existing = next.find((x) => x.name.toLowerCase() === t.name.toLowerCase());
      if (existing) {
        if (!existing.sessions.includes(s.id)) existing.sessions.push(s.id);
      } else {
        next.push({
          id: Date.now() + Math.random(),
          name: t.name,
          cat: t.cat,
          belt: "All belts",
          sessions: [s.id],
          video: "",
        });
        added++;
      }
    });
    return { lib: next, added };
  }, []);

  const saveSession = useCallback(
    (draft: SessionDraft, editId: number | null) => {
      if (!draft.title.trim() || !draft.date) {
        showToast("Add a title and date first");
        return;
      }
      if (editId) {
        const current = sessions.find((s) => s.id === editId);
        if (!current) return;
        const locked = confirmed.includes(editId);
        const updated: Session = {
          ...current,
          title: draft.title.trim(),
          date: draft.date,
          time: draft.time,
          type: draft.type,
          capacity: Number.isFinite(draft.capacity) ? draft.capacity : 20,
          video: draft.video,
          notes: draft.notes,
          booked: locked ? current.booked : [...draft.booked],
          techniques: locked ? current.techniques : [...draft.techniques],
        };
        setSessions((prev) => prev.map((s) => (s.id === editId ? updated : s)));
        if (!locked) {
          setApprovalState((as) => {
            const copy: Record<number, Record<number, boolean>> = { ...as, [editId]: { ...(as[editId] || {}) } };
            draft.booked.forEach((m) => {
              if (copy[editId][m] === undefined) copy[editId][m] = true;
            });
            return copy;
          });
          setLibrary((lib) => syncLibInto(lib, updated).lib);
        }
        showToast("Session updated");
      } else {
        const ns: Session = {
          id: Date.now(),
          date: draft.date,
          time: draft.time,
          type: draft.type,
          title: draft.title.trim(),
          techniques: [...draft.techniques],
          video: draft.video,
          notes: draft.notes,
          capacity: Number.isFinite(draft.capacity) ? draft.capacity : 20,
          booked: [],
        };
        let added = 0;
        setSessions((prev) => [ns, ...prev]);
        setLibrary((lib) => {
          const r = syncLibInto(lib, ns);
          added = r.added;
          return r.lib;
        });
        showToast(
          "Session published!" +
            (added ? " · " + added + " technique" + (added > 1 ? "s" : "") + " added to library" : ""),
        );
      }
      closeModal();
    },
    [sessions, confirmed, showToast, closeModal, syncLibInto],
  );

  const togAtt = useCallback((sid: number, mid: number, val: boolean) => {
    setApprovalState((as) => ({ ...as, [sid]: { ...(as[sid] || {}), [mid]: val } }));
  }, []);

  const confirmAtt = useCallback(
    (sid: number) => {
      const s = sessions.find((x) => x.id === sid);
      if (!s) return;
      const st = approvalState[sid] || {};

      setConfirmed((prev) => (prev.includes(sid) ? prev : [...prev, sid]));

      setTA((prevTA) => {
        let nextTA = [...prevTA];
        s.booked.forEach((mid) => {
          const attended = st[mid] !== false;
          if (attended) {
            s.techniques.forEach((t) => {
              const dupe = nextTA.find((ta) => ta.techName === t.name && ta.sid === sid && ta.mid === mid);
              if (!dupe) {
                nextTA.push({ techName: t.name, cat: t.cat, sid, stitle: s.title, date: s.date, mid });
              }
            });
          } else {
            nextTA = nextTA.filter((ta) => !(ta.sid === sid && ta.mid === mid));
          }
        });
        return nextTA;
      });

      setPD((prevPD) => {
        const nextPD = { ...prevPD };
        s.booked.forEach((mid) => {
          if (st[mid] !== false) {
            s.techniques.forEach((t) => {
              const key = mid + "_" + t.name;
              if (!nextPD[key]) nextPD[key] = { level: 0, updatedAt: s.date };
            });
          }
        });
        return nextPD;
      });

      setMembers((prevM) =>
        prevM.map((m) => {
          if (!s.booked.includes(m.id)) return m;
          const attended = st[m.id] !== false;
          if (!attended && m.streak > 0) return { ...m, streak: Math.max(0, m.streak - 1) };
          return m;
        }),
      );

      showToast("Attendance confirmed");
    },
    [sessions, approvalState, showToast],
  );

  const reopenApproval = useCallback(
    (sid: number) => {
      const s = sessions.find((x) => x.id === sid);
      if (!s) return;
      const st = approvalState[sid] || {};
      setConfirmed((prev) => prev.filter((x) => x !== sid));
      setMembers((prevM) =>
        prevM.map((m) => (s.booked.includes(m.id) && st[m.id] === false ? { ...m, streak: m.streak + 1 } : m)),
      );
      setTA((prevTA) => prevTA.filter((ta) => !(ta.sid === sid)));
      showToast("Session reopened");
    },
    [sessions, approvalState, showToast],
  );

  const grantSO = useCallback(
    (mid: number, tn: string) => {
      setPD((prev) => ({ ...prev, [mid + "_" + tn]: { level: 4, updatedAt: today() } }));
      showToast("Sign-off granted for " + tn);
    },
    [showToast],
  );

  const denySO = useCallback(
    (mid: number, tn: string) => {
      setPD((prev) => ({ ...prev, [mid + "_" + tn]: { level: 2, updatedAt: today() } }));
      showToast("Moved back to “Getting it” — keep drilling");
    },
    [showToast],
  );

  const setProf = useCallback(
    (tn: string, cat: string, stitle: string, date: string, lv: number, sid: number) => {
      if (lv > 3) {
        showToast("Level 4 requires coach sign-off");
        return;
      }
      const key = ME + "_" + tn;
      const cur = PD[key] || { level: 0, updatedAt: "2000-01-01" };
      if (lv > cur.level) {
        const md = MIN_DAYS[cur.level];
        if (md !== undefined) {
          const diff = Math.floor((+new Date(today()) - +new Date(cur.updatedAt)) / 864e5);
          if (diff < md) {
            showToast("Wait " + (md - diff) + " more day" + (md - diff !== 1 ? "s" : "") + " before upgrading");
            return;
          }
        }
      }
      setPD((prev) => ({ ...prev, [key]: { level: lv, updatedAt: today() } }));
      setTA((prev) =>
        prev.find((ta) => ta.techName === tn && ta.mid === ME)
          ? prev
          : [...prev, { techName: tn, cat, sid, stitle, date, mid: ME }],
      );
      const msgs: Record<number, string> = {
        1: "Logged — drilling soon",
        2: "Keep working",
        3: "Submitted for coach sign-off!",
      };
      showToast(msgs[lv] || "Updated");
    },
    [PD, showToast],
  );

  const confirmBooking = useCallback(
    (sid: number) => {
      setMyBookings((prev) => {
        if (prev.includes(sid)) return prev;
        return [...prev, sid];
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sid && !s.booked.includes(ME) ? { ...s, booked: [...s.booked, ME] } : s)),
      );
      setApprovalState((as) => ({ ...as, [sid]: { ...(as[sid] || {}), [ME]: true } }));
      showToast("Booked! Content added to your training log");
      closeModal();
    },
    [showToast, closeModal],
  );

  const cancelBooking = useCallback(
    (sid: number) => {
      setMyBookings((prev) => prev.filter((x) => x !== sid));
      showToast("Booking cancelled");
      closeModal();
    },
    [showToast, closeModal],
  );

  const requestPrivate = useCallback(() => {
    showToast("Private session request sent!");
  }, [showToast]);

  const badges = useMemo(() => {
    const pending = sessions.filter((s) => s.booked.length && !confirmed.includes(s.id)).length;
    const signoff = Object.values(PD).filter((v) => v.level === 3).length;
    const t = today();
    const upcoming = myBookings.filter((id) => {
      const s = sessions.find((x) => x.id === id);
      return s && s.date >= t;
    }).length;
    return { pending, signoff, upcoming };
  }, [sessions, confirmed, PD, myBookings]);

  const value: StoreValue = {
    sessions,
    library,
    members,
    role,
    approvalState,
    confirmed,
    myBookings,
    PD,
    TA,
    page,
    goto,
    modal,
    openModal,
    closeModal,
    toast,
    showToast,
    isConfirmed,
    badges,
    switchRole,
    saveSession,
    togAtt,
    confirmAtt,
    reopenApproval,
    grantSO,
    denySO,
    setProf,
    confirmBooking,
    cancelBooking,
    requestPrivate,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
