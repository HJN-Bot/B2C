// Saved "lines to try" — golden lines the student pins in the Takeaway so they
// show up in the next practice's pre-start Ready card. Local-only (localStorage),
// mirrors the trying-point.ts pattern. Closes the learn -> reuse loop.

const KEY = "speakspark.savedLines";
const MAX = 6;

export interface SavedLine {
  id: string;
  text: string;
  /** Optional attribution, e.g. a speaker for a stolen line. */
  by?: string;
}

function read(): SavedLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? (raw as SavedLine[]).filter((l) => l && typeof l.text === "string") : [];
  } catch {
    return [];
  }
}

function write(lines: SavedLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines.slice(-MAX)));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export function getSavedLines(): SavedLine[] {
  return read();
}

export function isLineSaved(text: string): boolean {
  const t = text.trim().toLowerCase();
  return read().some((l) => l.text.trim().toLowerCase() === t);
}

/** Add if new (deduped, FIFO cap). Returns the updated list. */
export function saveLine(text: string, by?: string): SavedLine[] {
  const clean = text.trim();
  if (!clean) return read();
  const existing = read();
  if (existing.some((l) => l.text.trim().toLowerCase() === clean.toLowerCase())) return existing;
  const next = [...existing, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: clean, by }];
  write(next);
  return next.slice(-MAX);
}

export function removeLine(id: string): SavedLine[] {
  const next = read().filter((l) => l.id !== id);
  write(next);
  return next;
}

/** Toggle by text; returns true if now saved, false if removed. */
export function toggleLine(text: string, by?: string): boolean {
  if (isLineSaved(text)) {
    const t = text.trim().toLowerCase();
    write(read().filter((l) => l.text.trim().toLowerCase() !== t));
    return false;
  }
  saveLine(text, by);
  return true;
}
