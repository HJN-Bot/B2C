// Client-side practice history (no backend yet). Each finished practice run
// is saved to localStorage so the Takeaway can persist and the My/Library
// page can list past runs. Supabase persistence can replace this later.

export interface KTVScoreSnapshot { flow: number; words: number; sentences: number; story: number }

export interface SessionRecord {
  id: string;
  createdAt: string;        // ISO
  mode: string;             // practice mode label
  durationSeconds: number;
  wordCount: number;
  highlightWords: string[];
  ktvScore: KTVScoreSnapshot;
  transcript: string;       // trimmed
}

const KEY = "speakspark.sessionHistory";
const MAX = 50;

export function getSessions(): SessionRecord[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SessionRecord[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Save a finished run. Dedupes against the most recent entry (same transcript +
// duration) so re-opening the Takeaway page doesn't create duplicates.
export function saveSession(record: Omit<SessionRecord, "id" | "createdAt">): SessionRecord[] {
  try {
    const list = getSessions();
    const last = list[0];
    if (last && last.transcript === record.transcript && last.durationSeconds === record.durationSeconds) {
      return list;
    }
    const entry: SessionRecord = {
      ...record,
      transcript: record.transcript.slice(0, 4000),
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...list].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getSessions();
  }
}
