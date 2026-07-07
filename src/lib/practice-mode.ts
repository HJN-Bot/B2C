// A "practice mode" is really a SCENARIO: it bundles its own topic library with
// its own coach style. Chosen on Home, carried through PracticeRoom + Takeaway.
// The "practice feedback only" boundary stays on in every scenario — scenarios
// never turn SpeakSpark into a scorer or a full-speech generator.

export type PracticeModeId = "debate" | "science" | "exam" | "free";

export interface PracticeMode {
  id: PracticeModeId;
  label: string;
  emoji: string;
  blurb: string;
  /** Appended to the coach system prompt to flavour the feedback. */
  coachStyle: string;
  /** This scenario's own topic library (empty = bring your own). */
  topics: string[];
  /** Label for the topic card, e.g. "debate motion". */
  topicNoun: string;
}

export const PRACTICE_MODES: PracticeMode[] = [
  {
    id: "debate",
    label: "Debate",
    emoji: "🗣️",
    blurb: "Claim, evidence, rebuttal",
    coachStyle:
      "Mode: Debate. Coach argument structure — a clear claim, supporting evidence, and a rebuttal to the other side. Help them anticipate counter-arguments. Never write a full speech or assign a score.",
    topicNoun: "debate motion",
    topics: [
      "This house believes AI will help students more than it harms them.",
      "This house would ban homework in schools.",
      "Resolved: Space exploration is worth the cost.",
      "Should social media have a minimum age of 16?",
      "This house believes zoos do more good than harm.",
      "This house would make one science subject compulsory every year.",
    ],
  },
  {
    id: "science",
    label: "Science Talk",
    emoji: "🔬",
    blurb: "Explain a science idea clearly",
    coachStyle:
      "Mode: Science Talk. Coach a clear explanation of a science idea for a general audience — a hook, a simple explanation, one concrete example, and why it matters. Encourage plain language and storytelling over jargon.",
    topicNoun: "science topic",
    topics: [
      "How is AI changing the way doctors diagnose diseases?",
      "Why is renewable energy the key to our planet's future?",
      "How do self-driving cars make decisions in real time?",
      "What makes CRISPR a revolutionary tool in genetics?",
      "How do vaccines teach our bodies to fight disease?",
    ],
  },
  {
    id: "exam",
    label: "Exam Prep",
    emoji: "🎓",
    blurb: "TOEFL / IELTS-style structure",
    coachStyle:
      "Mode: Exam Prep. Use TOEFL/IELTS speaking expectations (clear position, reasons, and examples, with steady delivery). Coach the approach and structure only — never write a full scored answer or assign a band/score.",
    topicNoun: "exam question",
    topics: [
      "Describe a person who has influenced you, and explain why.",
      "Do you agree that technology makes people less social?",
      "Talk about a skill you would like to learn in the future.",
      "Is it better to study alone or in a group? Give reasons.",
      "Describe a place you would like to visit and explain why.",
    ],
  },
  {
    id: "free",
    label: "Free Talk",
    emoji: "💬",
    blurb: "Talk about anything",
    coachStyle:
      "Mode: Free Talk. Keep it relaxed and low-pressure. Encourage the student to keep their idea going and build confidence and fluency. Do not grade; coach gently.",
    topicNoun: "topic",
    topics: [],
  },
];

const STORAGE_KEY = "speakspark.practiceMode";

// Default scenario when the student hasn't chosen one.
const DEFAULT_MODE = PRACTICE_MODES.find((m) => m.id === "debate") ?? PRACTICE_MODES[0];

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

/** A random topic from a scenario's library (or "" for bring-your-own). */
export function pickTopic(mode: PracticeMode, avoid?: string): string {
  const pool = mode.topics.filter((t) => t !== avoid);
  const list = pool.length ? pool : mode.topics;
  return list.length ? list[Math.floor(Math.random() * list.length)] : "";
}
