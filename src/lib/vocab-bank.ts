// Vocab bank — word upgrades the student saves from a Takeaway ("good →
// remarkable"), kept long-term so they can review them on the My page and reuse
// them. Local-only (localStorage), mirrors saved-lines.ts. Deduped by the
// upgraded word so the bank stays clean.

const KEY = "speakspark.vocabBank";
const MAX = 40;

export interface VocabItem {
  id: string;
  /** The student's original word, if the upgrade came as "from → to". */
  from?: string;
  /** The stronger word/phrase to reuse. */
  to: string;
  /** A short phrase showing the word in context, e.g. "a good idea". */
  context?: string;
  savedAt: number;
}

function read(): VocabItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? (raw as VocabItem[]).filter((v) => v && typeof v.to === "string") : [];
  } catch {
    return [];
  }
}

function write(items: VocabItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX)));
  } catch {
    /* non-fatal */
  }
}

export function getVocab(): VocabItem[] {
  // newest first for review
  return read().slice().reverse();
}

export function isVocabSaved(to: string): boolean {
  const t = to.trim().toLowerCase();
  return read().some((v) => v.to.trim().toLowerCase() === t);
}

/** Toggle by the upgraded word. Returns true if now saved, false if removed. */
export function toggleVocab(item: { from?: string; to: string; context?: string }): boolean {
  const to = item.to.trim();
  if (!to) return false;
  const key = to.toLowerCase();
  const existing = read();
  if (existing.some((v) => v.to.trim().toLowerCase() === key)) {
    write(existing.filter((v) => v.to.trim().toLowerCase() !== key));
    return false;
  }
  write([
    ...existing,
    { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, from: item.from?.trim() || undefined, to, context: item.context?.trim() || undefined, savedAt: Date.now() },
  ]);
  return true;
}

export function removeVocab(id: string): VocabItem[] {
  const next = read().filter((v) => v.id !== id);
  write(next);
  return next.slice().reverse();
}
