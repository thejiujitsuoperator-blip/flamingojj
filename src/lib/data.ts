// ── DOMAIN TYPES ──
export type SessionType = "Adult" | "Kids" | "Open mat" | "Competition";
export type TechCat = "Submission" | "Guard" | "Takedown" | "Escape" | "Kids";

export interface SessionTechnique {
  name: string;
  cat: TechCat;
}

export interface Session {
  id: number;
  date: string;
  time: string;
  type: SessionType;
  title: string;
  techniques: SessionTechnique[];
  video: string;
  notes: string;
  capacity: number;
  booked: number[];
}

export interface LibraryTechnique {
  id: number;
  name: string;
  cat: string;
  belt: string;
  sessions: number[];
  video: string;
}

export interface Member {
  id: number;
  name: string;
  belt: string;
  stripes: number;
  age: string;
  classes: number;
  streak: number;
}

export interface Proficiency {
  level: number;
  updatedAt: string;
}

export interface TechniqueActivity {
  techName: string;
  cat: string;
  sid: number;
  stitle: string;
  date: string;
  mid: number;
}

export type Role = "coach" | "member";

// ── CONSTANTS ──
export const ME = 1;

export const TC_ADULT = "var(--color-accent)";
export const TC_KIDS = "var(--color-accent-2)";
export const TC_OPEN = "var(--color-neutral-600)";

export const PL: Record<number, string> = {
  0: "Not rated",
  1: "Need reps",
  2: "Getting it",
  3: "Can apply",
  4: "Coach sign-off",
};

export const CAT_COLOR: Record<string, string> = {
  Submission: TC_ADULT,
  Guard: "var(--color-accent-2)",
  Takedown: "#c8a430",
  Escape: "var(--color-accent-2-600)",
  Kids: "var(--color-accent-500)",
};

export const MIN_DAYS: Record<number, number> = { 0: 0, 1: 3, 2: 7 };

// ── HELPERS ──
export function TC(t: string): string {
  return t === "Kids" ? TC_KIDS : t === "Open mat" ? TC_OPEN : TC_ADULT;
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function fmt(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function ini(n: string): string {
  return n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
}

export function tagClassFor(type: string): string {
  return type === "Kids" ? "tag-accent-2" : type === "Open mat" ? "tag-neutral" : "tag-accent";
}

// ── SEED DATA ──
export const initialSessions: Session[] = [
  {
    id: 1,
    date: "2025-06-16",
    time: "18:30",
    type: "Adult",
    title: "Back control & chokes",
    techniques: [
      { name: "Rear Naked Choke", cat: "Submission" },
      { name: "Body triangle", cat: "Guard" },
    ],
    video: "https://youtube.com",
    notes: "Focus on seatbelt grip first",
    capacity: 20,
    booked: [1, 2, 5, 6],
  },
  {
    id: 2,
    date: "2025-06-17",
    time: "17:00",
    type: "Kids",
    title: "Hip escapes & movement",
    techniques: [
      { name: "Shrimp drill", cat: "Kids" },
      { name: "Bridge & roll", cat: "Escape" },
    ],
    video: "",
    notes: "Fun relay races",
    capacity: 15,
    booked: [4],
  },
  {
    id: 3,
    date: "2025-06-21",
    time: "10:00",
    type: "Open mat",
    title: "Open mat Saturday",
    techniques: [],
    video: "",
    notes: "Free rolling",
    capacity: 30,
    booked: [],
  },
  {
    id: 4,
    date: "2025-06-22",
    time: "18:30",
    type: "Adult",
    title: "Guard passing series",
    techniques: [
      { name: "Torreando pass", cat: "Guard" },
      { name: "X-pass", cat: "Guard" },
      { name: "Stack pass", cat: "Guard" },
    ],
    video: "https://youtube.com",
    notes: "10 reps each side",
    capacity: 20,
    booked: [],
  },
];

export const initialLibrary: LibraryTechnique[] = [
  { id: 1, name: "Rear Naked Choke", cat: "Submission", belt: "All belts", sessions: [1], video: "https://youtube.com" },
  { id: 2, name: "Body triangle", cat: "Guard", belt: "Blue", sessions: [1], video: "" },
  { id: 3, name: "Shrimp drill", cat: "Kids", belt: "White", sessions: [2], video: "" },
  { id: 4, name: "Bridge & roll", cat: "Escape", belt: "White", sessions: [2], video: "" },
  { id: 5, name: "Torreando pass", cat: "Guard", belt: "Blue", sessions: [4], video: "https://youtube.com" },
  { id: 6, name: "X-pass", cat: "Guard", belt: "Blue", sessions: [4], video: "" },
  { id: 7, name: "Stack pass", cat: "Guard", belt: "Blue", sessions: [4], video: "" },
  { id: 8, name: "Single leg takedown", cat: "Takedown", belt: "White", sessions: [], video: "" },
  { id: 9, name: "Armbar from guard", cat: "Submission", belt: "Blue", sessions: [], video: "https://youtube.com" },
];

export const initialMembers: Member[] = [
  { id: 1, name: "Ana Pereira", belt: "Blue", stripes: 1, age: "Adult", classes: 34, streak: 8 },
  { id: 2, name: "Marcus Kim", belt: "White", stripes: 3, age: "Adult", classes: 28, streak: 10 },
  { id: 3, name: "James Okafor", belt: "Purple", stripes: 2, age: "Adult", classes: 67, streak: 5 },
  { id: 4, name: "Sofia Lima", belt: "White", stripes: 1, age: "Kids", classes: 12, streak: 3 },
  { id: 5, name: "David Torres", belt: "Blue", stripes: 3, age: "Adult", classes: 45, streak: 12 },
  { id: 6, name: "Priya Nair", belt: "White", stripes: 2, age: "Adult", classes: 18, streak: 4 },
  { id: 7, name: "Carlos Mendez", belt: "Brown", stripes: 1, age: "Adult", classes: 98, streak: 9 },
];

export const initialPD: Record<string, Proficiency> = {
  "1_Rear Naked Choke": { level: 2, updatedAt: "2025-06-16" },
  "1_Body triangle": { level: 0, updatedAt: "2025-06-16" },
};

export const initialTA: TechniqueActivity[] = [
  { techName: "Rear Naked Choke", cat: "Submission", sid: 1, stitle: "Back control & chokes", date: "2025-06-16", mid: 1 },
  { techName: "Body triangle", cat: "Guard", sid: 1, stitle: "Back control & chokes", date: "2025-06-16", mid: 1 },
];

export function buildInitialApproval(sessions: Session[]): Record<number, Record<number, boolean>> {
  const state: Record<number, Record<number, boolean>> = {};
  sessions.forEach((s) => {
    if (s.booked.length) {
      state[s.id] = {};
      s.booked.forEach((m) => {
        state[s.id][m] = true;
      });
    }
  });
  return state;
}

export type PageKey =
  | "dashboard"
  | "sessions"
  | "register"
  | "approval"
  | "signoff"
  | "members"
  | "library"
  | "my-training"
  | "book";
