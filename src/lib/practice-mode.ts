// Practice modes are chosen on Home and carried through PracticeRoom + Takeaway.
// They shape the coach's tone / system prompt. The "practice feedback only"
// boundary stays on in every mode — modes never turn SpeakSpark into a scorer
// or a full-speech generator.

export type PracticeModeId = "free" | "exam" | "story";

export interface PracticeMode {
  id: PracticeModeId;
  label: string;
  emoji: string;
  blurb: string;
  /** Appended to the coach system prompt to flavour the feedback. */
  coachStyle: string;
}

export const PRACTICE_MODES: PracticeMode[] = [
  {
    id: "free",
    label: "Free Talk Mode",
    emoji: "💬",
    blurb: "Low-pressure — talk about anything",
    coachStyle:
      "Mode: Free Talk. Keep it relaxed and low-pressure. Encourage the student to keep their idea going and build confidence and fluency. Do not grade; coach gently.",
  },
  {
    id: "exam",
    label: "Exam Prep Mode",
    emoji: "🎓",
    blurb: "TOEFL / IELTS-style structure",
    coachStyle:
      "Mode: Exam Prep. Use TOEFL/IELTS speaking expectations (clear position, reasons, and examples, with steady delivery). Coach the approach and structure only — never write a full scored answer or assign a band/score.",
  },
  {
    id: "story",
    label: "Story Mode",
    emoji: "📖",
    blurb: "Claim → example → why it matters",
    coachStyle:
      "Mode: Story. Focus on storytelling: a clear hook/claim, one vivid example, and why it matters. Help shape narrative flow and imagery, not exam scoring.",
  },
];

const STORAGE_KEY = "speakspark.practiceMode";

// Default coach style when the student hasn't chosen one. Exam Prep suits the
// structured speech / debate use case best. Switchable on the My page.
const DEFAULT_MODE = PRACTICE_MODES.find((m) => m.id === "exam") ?? PRACTICE_MODES[0];

export function getPracticeMode(): PracticeMode {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY) as PracticeModeId | null;
    return PRACTICE_MODES.find((mode) => mode.id === id) ?? DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function setPracticeMode(id: PracticeModeId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}
