// SpeakSpark — Graduation / famous-speech quote library (V0 seed, 20 cards).
// Spec: Design/specs/2026-06-27-graduation-speech-quote-library.md
//
// Copyright posture (spec §5): we store only SHORT excerpts + a source pointer,
// never full transcripts. `source_url` here points to Wikiquote (stable, public,
// verifiable). Before any public/commercial release, swap in official transcript
// links (Stanford / Harvard / UT Austin / UN, etc.) and legal review.
//
// Each card turns a memorable line into a reusable, speech-ready practice unit.

export type QuoteTheme = "courage" | "curiosity" | "resilience" | "future";
export type QuoteLevel = "easy" | "medium" | "advanced";
export type QuoteSourceType =
  | "official_transcript"
  | "official_video"
  | "public_article"
  | "manual_curated";

export interface QuoteCard {
  id: string;
  quote: string;
  speaker: string;
  event: string;
  year?: number;
  source_url: string;
  source_type: QuoteSourceType;
  theme: QuoteTheme;
  level: QuoteLevel;
  /** A fill-in-the-blank pattern the student can steal for their own talk. */
  sentence_pattern: string;
  /** Plain-English meaning for an 11–15 y/o. */
  meaning: string;
  /** A speaking prompt to practice from this line. */
  practice_prompt: string;
  /** One follow-up question to keep them talking. */
  follow_up: string;
  /** An example of the student reusing the pattern in their own words. */
  reuse_example: string;
}

export const QUOTE_LIBRARY: QuoteCard[] = [
  // ── Courage / identity ─────────────────────────────────────────────
  {
    id: "jobs-time",
    quote: "Your time is limited, so don't waste it living someone else's life.",
    speaker: "Steve Jobs",
    event: "Stanford Commencement",
    year: 2005,
    source_url: "https://en.wikiquote.org/wiki/Steve_Jobs",
    source_type: "public_article",
    theme: "courage",
    level: "medium",
    sentence_pattern: "Your ___ is limited, so don't waste it ___.",
    meaning: "You only get one life — use it to make your own choices, not other people's.",
    practice_prompt: "Talk about one choice that matters to you and why it's yours to make.",
    follow_up: "What is one thing you want to decide for yourself this year?",
    reuse_example: "My time in school is limited, so I don't want to waste it being afraid to speak.",
  },
  {
    id: "jobs-hungry",
    quote: "Stay hungry. Stay foolish.",
    speaker: "Steve Jobs",
    event: "Stanford Commencement",
    year: 2005,
    source_url: "https://en.wikiquote.org/wiki/Steve_Jobs",
    source_type: "public_article",
    theme: "courage",
    level: "easy",
    sentence_pattern: "Stay ___. Stay ___.",
    meaning: "Keep wanting to learn, and stay brave enough to try new things.",
    practice_prompt: "Tell me about a new thing you want to be brave enough to try.",
    follow_up: "What's stopping you, and what's one small first step?",
    reuse_example: "Stay curious. Stay brave.",
  },
  {
    id: "mcraven-bed",
    quote: "If you want to change the world, start off by making your bed.",
    speaker: "Admiral William H. McRaven",
    event: "University of Texas at Austin Commencement",
    year: 2014,
    source_url: "https://en.wikiquote.org/wiki/William_H._McRaven",
    source_type: "public_article",
    theme: "courage",
    level: "easy",
    sentence_pattern: "If you want to ___, start off by ___.",
    meaning: "Big change begins with small tasks you finish well.",
    practice_prompt: "Talk about one small habit that could lead to a big change for you.",
    follow_up: "How would that small thing add up over a year?",
    reuse_example: "If you want to speak better, start off by saying one sentence out loud.",
  },
  {
    id: "mobama-success",
    quote: "Success isn't about how much money you make; it's about the difference you make in people's lives.",
    speaker: "Michelle Obama",
    event: "Public address",
    source_url: "https://en.wikiquote.org/wiki/Michelle_Obama",
    source_type: "public_article",
    theme: "courage",
    level: "medium",
    sentence_pattern: "___ isn't about ___; it's about ___.",
    meaning: "What really matters is the good you do for others, not what you own.",
    practice_prompt: "Talk about a kind of success that isn't about money.",
    follow_up: "Whose life would you most want to make a difference in?",
    reuse_example: "Winning isn't about the trophy; it's about how hard I tried.",
  },
  {
    id: "emerson-yourself",
    quote: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    speaker: "Ralph Waldo Emerson",
    event: "Attributed / essays",
    source_url: "https://en.wikiquote.org/wiki/Ralph_Waldo_Emerson",
    source_type: "manual_curated",
    theme: "courage",
    level: "advanced",
    sentence_pattern: "To be ___ in a world that is constantly trying to ___ is the greatest ___.",
    meaning: "Staying true to who you are is hard — and it's a real achievement.",
    practice_prompt: "Talk about a time it was hard to be yourself, and what you did.",
    follow_up: "What's one thing about you that you never want to change?",
    reuse_example: "To stay calm in a room that is constantly rushing you is a real skill.",
  },

  // ── Curiosity / science ────────────────────────────────────────────
  {
    id: "tyson-science",
    quote: "The good thing about science is that it's true whether or not you believe in it.",
    speaker: "Neil deGrasse Tyson",
    event: "Public talk",
    source_url: "https://en.wikiquote.org/wiki/Neil_deGrasse_Tyson",
    source_type: "public_article",
    theme: "curiosity",
    level: "medium",
    sentence_pattern: "The good thing about ___ is that ___.",
    meaning: "Facts stay true even if people don't want to believe them.",
    practice_prompt: "Explain one science fact that is true no matter what people think.",
    follow_up: "How could you prove it to someone who doubts it?",
    reuse_example: "The good thing about evidence is that it works whether or not you like it.",
  },
  {
    id: "curie-fear",
    quote: "Nothing in life is to be feared, it is only to be understood.",
    speaker: "Marie Curie",
    event: "Attributed",
    source_url: "https://en.wikiquote.org/wiki/Marie_Curie",
    source_type: "manual_curated",
    theme: "curiosity",
    level: "medium",
    sentence_pattern: "Nothing in ___ is to be feared, it is only to be ___.",
    meaning: "When you understand something, it stops being scary.",
    practice_prompt: "Talk about something that seemed scary until you understood it.",
    follow_up: "What helped you finally understand it?",
    reuse_example: "Nothing in this topic is to be feared, it is only to be explained clearly.",
  },
  {
    id: "sagan-known",
    quote: "Somewhere, something incredible is waiting to be known.",
    speaker: "Carl Sagan",
    event: "Attributed",
    source_url: "https://en.wikiquote.org/wiki/Carl_Sagan",
    source_type: "manual_curated",
    theme: "curiosity",
    level: "medium",
    sentence_pattern: "Somewhere, something ___ is waiting to be ___.",
    meaning: "The universe is full of amazing things we haven't discovered yet.",
    practice_prompt: "Talk about a discovery you wish scientists would make.",
    follow_up: "Why would that discovery change our lives?",
    reuse_example: "Somewhere, something useful is waiting to be invented.",
  },
  {
    id: "dfw-realities",
    quote: "The most obvious, important realities are often the ones that are hardest to see and talk about.",
    speaker: "David Foster Wallace",
    event: "Kenyon College Commencement",
    year: 2005,
    source_url: "https://en.wikiquote.org/wiki/David_Foster_Wallace",
    source_type: "public_article",
    theme: "curiosity",
    level: "advanced",
    sentence_pattern: "The most ___ things are often the hardest to ___.",
    meaning: "The things that matter most can be the easiest to overlook.",
    practice_prompt: "Talk about an everyday thing most people never notice.",
    follow_up: "Why do you think people miss it?",
    reuse_example: "The most important ideas are often the hardest to say simply.",
  },
  {
    id: "einstein-questioning",
    quote: "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
    speaker: "Albert Einstein",
    event: "Attributed",
    source_url: "https://en.wikiquote.org/wiki/Albert_Einstein",
    source_type: "manual_curated",
    theme: "curiosity",
    level: "medium",
    sentence_pattern: "The important thing is not to stop ___.",
    meaning: "Never stop asking questions — curiosity is worth it on its own.",
    practice_prompt: "Talk about a question you've always wanted answered.",
    follow_up: "What's the first step to finding the answer?",
    reuse_example: "The important thing is not to stop trying.",
  },

  // ── Resilience / failure ───────────────────────────────────────────
  {
    id: "rowling-failing",
    quote: "It is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all.",
    speaker: "J. K. Rowling",
    event: "Harvard Commencement",
    year: 2008,
    source_url: "https://en.wikiquote.org/wiki/J._K._Rowling",
    source_type: "public_article",
    theme: "resilience",
    level: "advanced",
    sentence_pattern: "It is impossible to ___ without ___.",
    meaning: "Everyone fails sometimes — playing it too safe is its own kind of failing.",
    practice_prompt: "Talk about a time you failed and what it taught you.",
    follow_up: "What would you tell a friend who is scared to try?",
    reuse_example: "It is impossible to learn a language without making mistakes.",
  },
  {
    id: "rowling-rockbottom",
    quote: "Rock bottom became the solid foundation on which I rebuilt my life.",
    speaker: "J. K. Rowling",
    event: "Harvard Commencement",
    year: 2008,
    source_url: "https://en.wikiquote.org/wiki/J._K._Rowling",
    source_type: "public_article",
    theme: "resilience",
    level: "medium",
    sentence_pattern: "___ became the foundation on which I ___.",
    meaning: "Your lowest moment can become the base you build something new on.",
    practice_prompt: "Talk about a hard moment that ended up helping you grow.",
    follow_up: "What did you build or learn afterward?",
    reuse_example: "That bad grade became the foundation on which I built a better plan.",
  },
  {
    id: "jordan-failed",
    quote: "I've failed over and over and over again in my life. And that is why I succeed.",
    speaker: "Michael Jordan",
    event: "Nike \"Failure\" campaign",
    source_url: "https://en.wikiquote.org/wiki/Michael_Jordan",
    source_type: "public_article",
    theme: "resilience",
    level: "easy",
    sentence_pattern: "I've ___ again and again, and that is why I ___.",
    meaning: "Failing a lot, and not quitting, is how you get good.",
    practice_prompt: "Talk about something you got better at by failing a lot first.",
    follow_up: "How many tries did it take before it clicked?",
    reuse_example: "I've forgotten my lines again and again, and that is why I practice out loud.",
  },
  {
    id: "mandela-rising",
    quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    speaker: "Nelson Mandela",
    event: "Attributed",
    source_url: "https://en.wikiquote.org/wiki/Nelson_Mandela",
    source_type: "manual_curated",
    theme: "resilience",
    level: "medium",
    sentence_pattern: "The greatest ___ lies not in ___, but in ___.",
    meaning: "What counts isn't avoiding failure — it's getting back up each time.",
    practice_prompt: "Talk about a time you got back up after something went wrong.",
    follow_up: "What helped you keep going?",
    reuse_example: "The greatest win lies not in never losing, but in trying again.",
  },
  {
    id: "denzel-fail",
    quote: "If you don't fail, you're not even trying.",
    speaker: "Denzel Washington",
    event: "University of Pennsylvania Commencement",
    year: 2011,
    source_url: "https://en.wikiquote.org/wiki/Denzel_Washington",
    source_type: "public_article",
    theme: "resilience",
    level: "easy",
    sentence_pattern: "If you don't ___, you're not even ___.",
    meaning: "If you never fail, it means you're not taking real chances.",
    practice_prompt: "Talk about a risk worth taking even if you might fail.",
    follow_up: "What's the worst that could happen — and could you handle it?",
    reuse_example: "If you don't ask questions, you're not even learning.",
  },

  // ── Future / responsibility ────────────────────────────────────────
  {
    id: "malala-change",
    quote: "One child, one teacher, one book, one pen can change the world.",
    speaker: "Malala Yousafzai",
    event: "UN Youth Assembly",
    year: 2013,
    source_url: "https://en.wikiquote.org/wiki/Malala_Yousafzai",
    source_type: "public_article",
    theme: "future",
    level: "easy",
    sentence_pattern: "One ___, one ___ can change the world.",
    meaning: "Small things, like education, have the power to change everything.",
    practice_prompt: "Talk about one small thing that could make the world better.",
    follow_up: "Who would it help first?",
    reuse_example: "One idea, one voice can change a classroom.",
  },
  {
    id: "jfk-ask",
    quote: "Ask not what your country can do for you — ask what you can do for your country.",
    speaker: "John F. Kennedy",
    event: "Inaugural Address",
    year: 1961,
    source_url: "https://en.wikiquote.org/wiki/John_F._Kennedy",
    source_type: "public_article",
    theme: "future",
    level: "medium",
    sentence_pattern: "Ask not what ___ can do for you — ask what you can do for ___.",
    meaning: "Don't just ask what you can get — ask what you can give.",
    practice_prompt: "Talk about something you could give to your school or community.",
    follow_up: "What's one thing you could start this month?",
    reuse_example: "Ask not what your team can do for you — ask what you can do for your team.",
  },
  {
    id: "obama-waiting",
    quote: "Change will not come if we wait for some other person or some other time. We are the ones we've been waiting for.",
    speaker: "Barack Obama",
    event: "Campaign speech",
    year: 2008,
    source_url: "https://en.wikiquote.org/wiki/Barack_Obama",
    source_type: "public_article",
    theme: "future",
    level: "medium",
    sentence_pattern: "___ will not come if we wait for ___.",
    meaning: "Don't wait for someone else — you can be the one who acts.",
    practice_prompt: "Talk about a change you don't want to wait for.",
    follow_up: "What could you do about it yourself?",
    reuse_example: "Better grades will not come if we wait for the last week.",
  },
  {
    id: "mandela-education",
    quote: "Education is the most powerful weapon which you can use to change the world.",
    speaker: "Nelson Mandela",
    event: "Attributed",
    source_url: "https://en.wikiquote.org/wiki/Nelson_Mandela",
    source_type: "manual_curated",
    theme: "future",
    level: "easy",
    sentence_pattern: "___ is the most powerful ___ you can use to ___.",
    meaning: "Learning is the strongest tool you have to make change.",
    practice_prompt: "Talk about how learning something changed how you see the world.",
    follow_up: "What do you most want to learn next?",
    reuse_example: "Curiosity is the most powerful tool you can use to learn faster.",
  },
  {
    id: "earhart-decision",
    quote: "The most difficult thing is the decision to act; the rest is merely tenacity.",
    speaker: "Amelia Earhart",
    event: "Attributed",
    source_url: "https://en.wikiquote.org/wiki/Amelia_Earhart",
    source_type: "manual_curated",
    theme: "future",
    level: "medium",
    sentence_pattern: "The most difficult thing is the decision to ___; the rest is ___.",
    meaning: "Starting is the hard part — after that, you just keep going.",
    practice_prompt: "Talk about something you kept doing once you finally started.",
    follow_up: "What made you decide to start?",
    reuse_example: "The most difficult thing is the decision to speak; the rest is just practice.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

/** N random "steal these lines" patterns with attribution, for the Takeaway. */
export function pickStealLines(n = 3): { pattern: string; speaker: string; quote: string }[] {
  const shuffled = [...QUOTE_LIBRARY].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map((c) => ({ pattern: c.sentence_pattern, speaker: c.speaker, quote: c.quote }));
}

/** A stable "quote of the day" (same for a given day) — for a future Start starter. */
export function quoteOfTheDay(date = new Date()): QuoteCard {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return QUOTE_LIBRARY[dayIndex % QUOTE_LIBRARY.length];
}
