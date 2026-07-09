import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Blocks, BookOpen, Brain, ChevronRight, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, TrendingUp, Waves, Wrench, type LucideIcon } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";
import { callGeminiProxy } from "@/lib/gemini-proxy";
import { pickStealLines } from "@/data/quoteLibrary";
import { toggleLine, isLineSaved } from "@/lib/saved-lines";
import { toggleVocab, isVocabSaved } from "@/lib/vocab-bank";
import { Pin, Bookmark, RefreshCw } from "lucide-react";
import { getPracticeMode } from "@/lib/practice-mode";
import { getCustomPrompt } from "@/lib/coach-prefs";
import { setNextTryingPoint } from "@/lib/trying-point";
import { saveSession } from "@/lib/session-history";

const MODEL_NAME = "gemini-2.5-flash";
const LAST_SESSION_CACHE = "meaningfully.lastSession";

interface KTVScore { flow: number; words: number; sentences: number; story: number }
type KTVMetric = keyof KTVScore;
interface KTVEvent { id: number; metric: KTVMetric; delta: number; reason: string }
interface LocationState {
  timer?: number;
  highlightCount?: number;
  ktvScore?: KTVScore;
  ktvEvents?: KTVEvent[];
  highlightWords?: string[];
  transcript?: string;
}

interface NextRunPlan {
  focus: string;
  say_this: string;
  reuse_words: string[];
  one_move: string;
}

// Each piece of feedback can point back to something the student actually said.
interface Evidence {
  point: string;
  quote?: string;
}

interface AiTakeaway {
  encouragement: string;
  summary: string[];           // top-down: what the student actually talked about
  next_run_plan: NextRunPlan;
  what_worked: Evidence[];     // block 1: done well (credit)
  amplify: Evidence[];         // block 2: a strength worth doing MORE of
  make_stronger: Evidence[];   // block 2: one thing to change/fix
}

interface CoachMessage {
  id: string;
  role: "coach" | "user" | "system";
  text: string;
}

const KTV_META: Record<KTVMetric, { label: string; Icon: LucideIcon; color: string }> = {
  flow: { label: "Flow", Icon: Waves, color: "#58A9FF" },
  words: { label: "Words", Icon: BookOpen, color: "#16A34A" },
  sentences: { label: "Sentences", Icon: Blocks, color: "#D97706" },
  story: { label: "Argument", Icon: Brain, color: "#7C3AED" },
};


const PRESETS = [
  { label: "Ask me a question", prompt: "Ask me ONE short question about my topic to practice answering next time. Don't answer it for me." },
  { label: "My best line", prompt: "What was the single strongest thing I said, and why did it work?" },
  { label: "Stronger words", prompt: "Give me 3 stronger words or phrases I can reuse next time, each with one short example." },
  { label: "Expand my point", prompt: "Take my thinnest point and show me how to develop it: claim, example, and why it matters — using my own idea, not a full script." },
  { label: "Counter my point", prompt: "Give me 3 strong counter-arguments against my main point so I can prepare rebuttals. One short sentence each." },
  { label: "My weakest link", prompt: "Point out the weakest part of my argument and one concrete way to fix it." },
];

const STOP_WORDS = new Set([
  "about", "again", "because", "before", "could", "every", "first", "from", "have", "into", "like", "more",
  "other", "people", "really", "science", "should", "something", "their", "there", "these", "thing", "think",
  "this", "those", "through", "today", "using", "want", "were", "when", "where", "which", "with", "would",
]);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  return mins > 0 ? `${mins}m ${seconds % 60}s` : `${seconds}s`;
}

// The model occasionally emits light Markdown (*, **, _). Render it as real
// emphasis instead of showing literal asterisks. (Prompt also asks for none.)
function renderInline(text: string): ReactNode {
  if (!text || !/[*_]/.test(text)) return text;
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let last = 0, k = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else out.push(<em key={k++}>{m[2] ?? m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// P4-2: playful, non-scorecard headline for the top of the takeaway.
const CELEBRATIONS = [
  (t: string) => `Your spark stayed lit for ${t}!`,
  (t: string) => `You kept your idea going for ${t} — that's a real run!`,
  (t: string) => `${t} of you being brave enough to speak. Love it.`,
  (t: string) => `That's ${t} of your own voice. Nice one!`,
];

function celebrationHeadline(seconds: number) {
  if (!seconds) return "You showed up to practice. That already counts!";
  return CELEBRATIONS[seconds % CELEBRATIONS.length](formatTime(seconds));
}

// P5-2: word-based growth trend instead of a numeric score map.
const GROWTH_TREND: Record<KTVMetric, { strong: string; growing: string; start: string }> = {
  flow: { strong: "Smoother, longer flow", growing: "Flow is getting steadier", start: "Room to keep talking longer" },
  words: { strong: "Stronger word choices", growing: "Reaching for richer words", start: "Room for bolder words" },
  sentences: { strong: "Clearer, fuller sentences", growing: "Sentences are filling out", start: "Room for fuller sentences" },
  story: { strong: "A clear claim with why it matters", growing: "Linking facts to why they matter", start: "Room to add why it matters" },
};

function trendLevel(value: number): "strong" | "growing" | "start" {
  if (value >= 70) return "strong";
  if (value >= 35) return "growing";
  return "start";
}

// ── "Say it like this" — natural, spoken-English "golden lines", the way
// engaging speakers actually talk in interviews / YouTube / TED, NOT textbook
// templates. Placeholder set — swap for a sourced, authoritative library later.
// {topic} fills with a word the student actually used when we have one.
const SENTENCE_FRAMES = [
  "Here's the thing about {topic}: ___.",
  "What really blew my mind is ___.",
  "Most people don't realize that ___.",
  "And that's when it hit me — ___.",
  "Now here's where it gets interesting: ___.",
  "I used to think ___ — turns out, ___.",
  "If there's one thing to remember, it's this: ___.",
];

// The thinking structure for stretching a thin point into a full beat.
const BUILD_OUT_SKELETON = [
  "Claim — say your main point in one clear line.",
  "Example — back it with one real example or number.",
  "Why it matters — connect it to real life.",
  "So what — end with what you want them to remember.",
];

function fillFrame(template: string, topic: string): string {
  return template.replace(/\{topic\}/g, topic || "this");
}

// reuse_words arrive as "their word → stronger upgrade"; split into a chip.
function parsePowerWord(entry: string): { from?: string; to: string } {
  const parts = entry.split(/\s*(?:→|->|»|=>)\s*/);
  if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
    return { from: parts[0].trim(), to: parts.slice(1).join(" → ").trim() };
  }
  return { to: entry.trim() };
}

// Pull a tiny 2–3 word context (one word before + one after) from the student's
// own transcript so an upgraded word is remembered in the scene they said it.
// Returns null for multi-word targets or when the word isn't found.
function wordContext(transcript: string, word: string): { before: string; after: string } | null {
  if (!transcript || !word || /\s/.test(word.trim())) return null;
  const tokens = transcript.split(/\s+/);
  const clean = (t?: string) => (t ? t.replace(/[^a-zA-Z'-]/g, "") : "");
  const target = clean(word).toLowerCase();
  if (!target) return null;
  const idx = tokens.findIndex((t) => clean(t).toLowerCase() === target);
  if (idx === -1) return null;
  return { before: clean(tokens[idx - 1]), after: clean(tokens[idx + 1]) };
}

function parseJson<T>(text: string): T | null {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

function normalizeList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const list = value.map((item) => String(item || "").trim()).filter(Boolean);
  return list.length ? list.slice(0, 4) : fallback;
}

// Accepts either plain strings or { point/advice, quote } objects from the model.
function normalizeEvidence(value: unknown, fallback: Evidence[]): Evidence[] {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .map((item): Evidence | null => {
      if (typeof item === "string") {
        const point = item.trim();
        return point ? { point } : null;
      }
      const record = item as { point?: unknown; advice?: unknown; quote?: unknown };
      const point = String(record?.point ?? record?.advice ?? "").trim();
      const quote = String(record?.quote ?? "").trim();
      return point ? { point, quote: quote || undefined } : null;
    })
    .filter((item): item is Evidence => Boolean(item));
  return list.length ? list.slice(0, 3) : fallback;
}

function normalizeTakeaway(value: Partial<AiTakeaway> | null): AiTakeaway | null {
  const plan = value?.next_run_plan;
  if (!plan?.focus || !plan?.say_this || !plan?.one_move) return null;
  return {
    encouragement: String(value?.encouragement || "You completed a real practice run.").trim(),
    summary: normalizeList(value?.summary, []),
    next_run_plan: {
      focus: String(plan.focus).trim(),
      say_this: String(plan.say_this).trim(),
      reuse_words: normalizeList(plan.reuse_words, []),
      one_move: String(plan.one_move).trim(),
    },
    what_worked: normalizeEvidence(value?.what_worked, [{ point: "You gave the coach real content to build from." }]),
    amplify: normalizeEvidence(value?.amplify, [{ point: "Keep developing your strongest idea further." }]),
    make_stronger: normalizeEvidence(value?.make_stronger, [{ point: String(plan.one_move) }]),
  };
}

function getUsefulWords(transcript: string, highlightWords: string[]) {
  const fromHighlights = highlightWords.map((word) => word.trim()).filter(Boolean);
  const fromTranscript = transcript
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !STOP_WORDS.has(word));

  return Array.from(new Set([...fromHighlights, ...fromTranscript])).slice(0, 4);
}

function createLocalTakeaway(session: {
  timer: number;
  wordCount: number;
  highlightCount: number;
  highlightWords: string[];
  ktvScore: KTVScore;
  transcript: string;
}): AiTakeaway {
  const usefulWords = getUsefulWords(session.transcript, session.highlightWords);
  const reuseWords = usefulWords.length ? usefulWords : ["because", "for example", "this shows"];
  const scoreEntries = Object.entries(session.ktvScore) as [KTVMetric, number][];
  const weakest = scoreEntries.reduce((min, item) => item[1] < min[1] ? item : min, scoreEntries[0] ?? ["story", 0])[0];

  const focusByMetric: Record<KTVMetric, string> = {
    flow: "Keep one idea moving without stopping too long.",
    words: "Reuse 2-3 stronger science words from your own speech.",
    sentences: "Turn short phrases into one complete claim and one example.",
    story: "Connect your fact to why it matters in real life.",
  };

  const moveByMetric: Record<KTVMetric, string> = {
    flow: "Before speaking, say the first sentence once in your head.",
    words: "Pick two words from the blue chips and use them again.",
    sentences: "Use this frame: My point is..., because..., for example...",
    story: "End with: This matters because...",
  };

  const mainWord = reuseWords[0];

  // Honest placeholder summary — the real, topic-aware summary comes from the AI;
  // this only shows when the AI call fails, so don't fake specificity here.
  const summary: string[] = [
    session.timer
      ? `You spoke for ${formatTime(session.timer)}. (Basic recap — the AI summary couldn't load this time.)`
      : "You reached the takeaway page. (Basic recap — the AI summary couldn't load this time.)",
  ];

  return {
    encouragement: session.wordCount > 0
      ? "You finished a real speaking run, so now we can make the next one sharper."
      : "You reached the takeaway page; the next run will give the coach more words to build from.",
    summary,
    next_run_plan: {
      focus: focusByMetric[weakest],
      say_this: "My point is ___, because ___, and one example is ___. (Fill this frame with your real topic next run.)",
      reuse_words: reuseWords,
      one_move: moveByMetric[weakest],
    },
    what_worked: [
      { point: session.timer ? `You stayed with the practice for ${formatTime(session.timer)}.` : "You reached the reflection step." },
      session.highlightCount || session.highlightWords.length
        ? { point: "You saved useful moments that can be reused next time.", quote: session.highlightWords[0] }
        : { point: "You gave the coach a starting point for your next run." },
    ],
    amplify: [
      mainWord
        ? { point: `You reached for "${mainWord}" — lean into more words like it.`, quote: mainWord }
        : { point: "You kept your idea going — do even more of that next time." },
    ],
    make_stronger: [
      { point: "Add one concrete example after your main point.", quote: mainWord },
      { point: "Use because, for example, and this matters to connect the idea." },
    ],
  };
}

function createLocalChatAnswer(request: string, takeaway: AiTakeaway | null, transcript: string, highlightWords: string[]) {
  const lower = request.toLowerCase();
  const words = getUsefulWords(transcript, highlightWords);

  if (lower.includes("vocab") || lower.includes("word") || lower.includes("phrase")) {
    const picks = words.length ? words.slice(0, 3) : ["cause", "effect", "evidence"];
    return `Try these next:\n${picks.map((word) => `- ${word}`).join("\n")}\nSentence frame: This shows the effect because...`;
  }

  if (lower.includes("story") || lower.includes("claim") || lower.includes("evidence") || lower.includes("impact")) {
    return "Use this storyline:\nClaim: My main idea is...\nExample: One real case is...\nImpact: This matters because...";
  }

  if (lower.includes("question") || lower.includes("deeper") || lower.includes("deep")) {
    return "Here's one to practice with:\nWhat is one real example that proves your main point?\n(Try answering it out loud next run — I won't answer it for you.)";
  }

  if (lower.includes("highlight") || lower.includes("shine") || lower.includes("best") || lower.includes("good")) {
    return words.length
      ? `Your strong moment: when you used "${words[0]}". Keep doing that — name your idea, then back it up.`
      : "Your strong moment: you kept going and finished the run. Next time, say your best line a little louder.";
  }

  if (lower.includes("fun") || lower.includes("interesting") || lower.includes("story")) {
    return "Make it more fun next time:\n- Open with a tiny surprise or a question.\n- Add one real example people can picture.";
  }

  if (lower.includes("example")) {
    return "Add two examples:\n1. A daily-life example people can picture.\n2. A science example that explains the cause.";
  }

  return takeaway
    ? `Next run: ${takeaway.next_run_plan.focus}\nSay: ${takeaway.next_run_plan.say_this}`
    : "Try one clear claim, one example, and one reason why it matters.";
}

function buildTakeawayPrompt(context: string, coachStyle: string) {
  const own = getCustomPrompt();
  return `You are SpeakSpark, a warm, encouraging IELTS-style speaking coach for Chinese middle-school students (ages 11-15) practicing English science presentations.
${coachStyle}${own ? `\nThe student set their own focus: "${own}". Honour it as long as it stays within coaching (no full speeches, no scores).` : ""}

First UNDERSTAND what the student was actually arguing — read the whole transcript as a real talk on a real topic, not a bag of words. Then coach with advice tied to THAT topic and to their KTV scores.
Rules:
- BE CONCISE. Every field is ONE short sentence (~16 words max). No long explanations, no second sentences, no lists inside a field. Short and warm wins.
- PLAIN TEXT ONLY. No Markdown — no asterisks (*), no **bold**, no _italics_, no # headings, no bullet characters.
- Ground feedback in IELTS speaking bands (fluency, vocabulary, grammar range, coherence) but phrase it simply and kindly for a kid, and always end on encouragement.
- Use ONLY ideas supported by the transcript, highlights, and score events. Never invent a topic. If the transcript is too thin to tell the topic, say so plainly instead of guessing.
- "summary": 1-2 COMPLETE SENTENCES naming the actual topic and the point they were making (e.g. "You explained how renewable energy could replace coal, and gave wind power as an example."). NEVER output a list of disconnected words.
- The "encouragement" should be warm and a little playful, not a score.
- "reuse_words": 3-5 SYNONYM UPGRADES — for words the student actually used, give a stronger/more precise alternative fitting their topic. Format each as "their word → upgrade" (e.g. "good → remarkable", "a lot of → a vast amount of"). Pick words they really said.
- "say_this": rewrite ONE real sentence the student said into a higher-level version of THE SAME point — keep their meaning, upgrade the structure/connectors (e.g. "X is significant because…", "One striking example is…"). It must read as a coherent sentence about their topic, never echo a single keyword.
- Pick the biggest GROWTH AREA from "ktv_score" (their weakest of flow/words/sentences/story) and aim "say_this", "one_move" and "make_stronger" at it. Do NOT mention raw scores or say "your X score is the lowest / highest" — frame it warmly (e.g. "A great next step is to finish your point with why it matters"). flow=keep one idea going, words=stronger/precise words, sentences=fuller complete sentences, story=claim+example+why.
- "amplify": the skill they did BEST, with a CONCRETE way to do more of it — give a specific example or sentence frame, not vague praise.
- BE CONCRETE, never vague: each "amplify"/"make_stronger" point includes a usable example, a sentence frame, or exact words — not "do more of this".
- For every "what_worked", "amplify" and "make_stronger" item, include a SHORT exact quote (3-8 words) copied verbatim from the transcript as "quote". If no fitting quote exists, use "".

Return ONLY valid JSON:
{
  "encouragement": "one warm, playful sentence",
  "summary": ["1-2 full sentences naming the real topic and their point"],
  "next_run_plan": {
    "focus": "one specific growth focus (no score talk)",
    "say_this": "their own sentence upgraded — same point, stronger structure (not a repeat, not a keyword)",
    "reuse_words": ["3-5 'their word → stronger synonym' upgrades, drawn from words they used"],
    "one_move": "one tiny concrete action for the next run, with a specific example"
  },
  "what_worked": [{ "point": "what they did well (concrete)", "quote": "exact short phrase they said, or empty" }],
  "amplify": [{ "point": "best skill + a concrete way/example to do more", "quote": "the phrase it builds on, or empty" }],
  "make_stronger": [{ "point": "one concrete change with an example/frame (no score talk)", "quote": "the phrase this refers to, or empty" }]
}

Session:
${context}`;
}

function buildChatSystemPrompt(context: string, takeaway: AiTakeaway | null, coachStyle: string) {
  const own = getCustomPrompt();
  return `You are SpeakSpark's post-practice coach for a Chinese middle-school student.
${coachStyle}${own ? `\nThe student set their own focus: "${own}". Honour it within coaching limits.` : ""}
Answer ONLY based on this session. Keep answers short, concrete, and next-run focused.
Coach mode: practice feedback only. Never write a full speech or a complete answer for the student — coach by asking one question, giving a frame, or offering small reusable pieces (words, examples).
If the student asks you to "ask me a question", ask exactly ONE short question and do NOT answer it yourself.
Be concise and warm. Plain text only — NO Markdown (no *, **, _, #).
ALWAYS return ONLY valid JSON: { "answer": "2-3 short lines, plain text" }

Current takeaway:
${takeaway ? JSON.stringify(takeaway, null, 2) : "Not generated yet."}

Session data:
${context}`;
}

export default function TakeawayPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const apiReadyRef = useRef(true);
  const practiceMode = useMemo(() => getPracticeMode(), []);
  const cachedSession = useMemo<LocationState | null>(() => {
    if (state) return state;
    try {
      return JSON.parse(window.sessionStorage.getItem(LAST_SESSION_CACHE) || "null") as LocationState | null;
    } catch {
      return null;
    }
  }, [state]);

  const timer = cachedSession?.timer ?? 0;
  const highlightCount = cachedSession?.highlightCount ?? 0;
  const ktvScore = cachedSession?.ktvScore ?? { flow: 0, words: 0, sentences: 0, story: 0 };
  const ktvEvents = cachedSession?.ktvEvents ?? [];
  const highlightWords = cachedSession?.highlightWords ?? [];
  const transcript = cachedSession?.transcript?.replace(/\s+/g, " ").trim() ?? "";
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  const hasSessionData = Boolean(timer || highlightCount || transcript || highlightWords.length || ktvEvents.length);

  const sessionContext = useMemo(() => JSON.stringify({
    duration: formatTime(timer),
    timer_seconds: timer,
    word_count: wordCount,
    highlight_count: highlightCount,
    highlight_words: highlightWords,
    ktv_score: ktvScore,
    ktv_events: ktvEvents.slice(0, 8).map(({ metric, delta, reason }) => ({ metric, delta, reason })),
    transcript: transcript || "(No transcript captured.)",
  }, null, 2), [highlightCount, highlightWords, ktvEvents, ktvScore, timer, transcript, wordCount]);

  const [takeaway, setTakeaway] = useState<AiTakeaway | null>(null);
  const [takeawayStatus, setTakeawayStatus] = useState<"idle" | "thinking" | "ready" | "error">("idle");
  const [takeawayError, setTakeawayError] = useState("");
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "thinking" | "error">("idle");

  // Multi-turn conversation history (Gemini format)
  const chatHistoryRef = useRef<{ role: "user" | "model"; parts: [{ text: string }] }[]>([]);

  const ensureGemini = useCallback(async () => apiReadyRef.current, []);

  const getModel = useCallback(async () => {
    await ensureGemini();
    return null;
  }, [ensureGemini]);

  const generateTakeaway = useCallback(async () => {
    if (!hasSessionData) {
      setTakeawayStatus("idle");
      setChatMessages([{ id: makeId(), role: "system", text: "Finish one practice run first. Then I can build a real AI plan from your words." }]);
      return;
    }

    setTakeawayStatus("thinking");
    setTakeawayError("");
    try {
      const { text } = await callGeminiProxy({
        model: MODEL_NAME,
        responseMimeType: "application/json",
        temperature: 0.68,
        // gemini-2.5-flash spends ~700-800 "thinking" tokens that count against
        // this budget, so keep ample room or the JSON truncates -> fallback.
        maxOutputTokens: 4000,
        contents: [{ role: "user", parts: [{ text: buildTakeawayPrompt(sessionContext, practiceMode.coachStyle) }] }],
      });
      const parsed = normalizeTakeaway(parseJson<Partial<AiTakeaway>>(text));
      if (!parsed) throw new Error("AI returned an unreadable takeaway format");
      setTakeaway(parsed);
      setTakeawayStatus("ready");
      // Close the loop: this run's "one move" becomes Home's next trying point.
      setNextTryingPoint(parsed.next_run_plan.one_move);
      const openingLines = [
        parsed.encouragement,
        `Next focus: ${parsed.next_run_plan.focus}`,
      ];
      // Seed history so follow-up questions have context of what the coach already said
      chatHistoryRef.current = [
        { role: "model", parts: [{ text: JSON.stringify({ answer: openingLines.join("\n") }) }] },
      ];
      setChatMessages([
        { id: makeId(), role: "coach", text: parsed.encouragement },
        { id: makeId(), role: "coach", text: `Next focus: ${parsed.next_run_plan.focus}` },
      ]);
      setChatStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      const localPlan = createLocalTakeaway({ timer, wordCount, highlightCount, highlightWords, ktvScore, transcript });
      setTakeaway(localPlan);
      setTakeawayStatus("ready");
      setTakeawayError(message);
      setChatStatus("idle");
      setChatMessages([
        { id: makeId(), role: "coach", text: "Coach plan is ready from this run." },
        { id: makeId(), role: "coach", text: `Next focus: ${localPlan.next_run_plan.focus}` },
      ]);
    }
  }, [getModel, hasSessionData, sessionContext, timer, wordCount, highlightCount, highlightWords, ktvScore, transcript, practiceMode]);

  const askCoach = useCallback(async (request: string) => {
    const trimmed = request.trim();
    if (!trimmed || !hasSessionData || chatStatus === "thinking") return;

    setChatInput("");
    setChatStatus("thinking");
    setChatMessages((prev) => [...prev, { id: makeId(), role: "user", text: trimmed }]);

    // Append user turn to multi-turn history
    chatHistoryRef.current = [
      ...chatHistoryRef.current,
      { role: "user", parts: [{ text: trimmed }] },
    ];

    try {
      const { text } = await callGeminiProxy({
        model: MODEL_NAME,
        systemInstruction: buildChatSystemPrompt(sessionContext, takeaway, practiceMode.coachStyle),
        responseMimeType: "application/json",
        temperature: 0.68,
        maxOutputTokens: 2000,
        contents: chatHistoryRef.current,
      });
      const parsed = parseJson<{ answer?: string }>(text);
      if (!parsed?.answer?.trim()) throw new Error("AI returned an unreadable chat answer");
      const answer = parsed.answer!.trim();
      // Append model turn so next message has full context
      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        { role: "model", parts: [{ text: JSON.stringify({ answer }) }] },
      ];
      setChatMessages((prev) => [...prev, { id: makeId(), role: "coach", text: answer }]);
      setChatStatus("idle");
    } catch {
      const answer = createLocalChatAnswer(trimmed, takeaway, transcript, highlightWords);
      // Still append a stub so the conversation thread stays coherent
      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        { role: "model", parts: [{ text: JSON.stringify({ answer }) }] },
      ];
      setChatMessages((prev) => [...prev, { id: makeId(), role: "coach", text: answer }]);
      setChatStatus("idle");
    }
  }, [chatStatus, hasSessionData, sessionContext, takeaway, transcript, highlightWords, practiceMode]);

  useEffect(() => {
    void generateTakeaway();
  }, [generateTakeaway]);

  // Persist this run to the local Library once (dedupes internally).
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !hasSessionData) return;
    savedRef.current = true;
    saveSession({
      mode: practiceMode.label,
      durationSeconds: timer,
      wordCount,
      highlightWords,
      ktvScore,
      transcript,
    });
  }, [hasSessionData, practiceMode, timer, wordCount, highlightWords, ktvScore, transcript]);

  const plan = takeaway?.next_run_plan;
  // Real, complete golden lines from famous speeches (not blank templates).
  // "Shuffle" re-picks a fresh pair so the student can cycle through variety.
  const [stealLines, setStealLines] = useState(() => pickStealLines(2));
  // Word upgrades: show up to 3 from the coach's pool; shuffle re-picks a set.
  const [wordShuffleTick, setWordShuffleTick] = useState(0);
  const shownWords = useMemo(() => {
    const pool = plan?.reuse_words ?? [];
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, wordShuffleTick]);
  // Bumped when a line/word is pinned/saved, to re-read the saved state.
  const [pinTick, setPinTick] = useState(0);

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex min-h-dvh flex-col gap-4 overflow-y-auto px-4 pb-28 pt-6">
        {/* ═══════════ Hero — one short celebration + the single best line ═══════════ */}
        <section className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-500">Practice complete</p>
              <h1 className="mt-1 text-xl font-black leading-tight text-gray-900">{celebrationHeadline(timer)}</h1>
            </div>
            <div className="text-4xl">🎉</div>
          </div>
          {takeaway && takeaway.what_worked.length > 0 && (
            <div className="mt-3 rounded-2xl bg-amber-50/70 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">⭐ Your best line</p>
              <p className="mt-1 text-sm font-bold leading-relaxed text-gray-800">{renderInline(takeaway.what_worked[0].point)}</p>
              {takeaway.what_worked[0].quote && (
                <p className="mt-1.5 rounded-lg border-l-2 border-amber-200 bg-white/70 px-2 py-1 text-xs font-semibold italic text-gray-500">
                  You said: “{takeaway.what_worked[0].quote}”
                </p>
              )}
            </div>
          )}
        </section>

        {/* P5-4: coach-mode boundary shown as a persistent trust label */}
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-gray-100 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-gray-400">
          <ShieldCheck size={12} className="text-green-500" />
          {practiceMode.emoji} {practiceMode.label} · practice feedback only
        </div>

        {/* Honest fallback notice: if the AI takeaway failed, say so instead of
            passing off the basic local template as a real, topic-aware result. */}
        {takeawayError && takeawayStatus === "ready" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
              <AlertTriangle size={13} />
              Coach AI didn't respond — showing a basic version
            </div>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-600">
              The summary and advice below are generic placeholders, not based on what you said. Reason: {takeawayError}
            </p>
            <button onClick={() => void generateTakeaway()} className="mt-2 rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-amber-700 shadow-sm active:scale-95">
              Try again
            </button>
          </div>
        )}

        {/* Coach still writing (no takeaway yet) */}
        {!takeaway && takeawayStatus === "thinking" && (
          <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              Coach is writing your takeaway…
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-100" />
              <div className="h-14 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </section>
        )}

        {/* No run yet */}
        {!takeaway && takeawayStatus === "idle" && (
          <section className="rounded-[1.25rem] border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
            <p className="text-sm font-bold leading-relaxed text-blue-700">Finish one practice run, then your best line and "Say it like this" tips show up here.</p>
            <button onClick={() => navigate("/practice")} className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-600 shadow-sm">
              Start practice
            </button>
          </section>
        )}

        {/* ═══════════ LEVEL UP — three clear ways to say it better ═══════════ */}
        {takeaway && (
          <>
            <div className="px-1 pt-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                <h2 className="text-lg font-black text-gray-900">Level up</h2>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">Three ways to say it better — words, sentences, story.</p>
            </div>

            {/* ✨ WORDS — swap a word for a stronger one */}
            <section className="rounded-[1.25rem] border-l-4 border-green-400 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <p className="text-sm font-black text-gray-900">Words</p>
                </div>
                {plan && plan.reuse_words.length > 3 && (
                  <button onClick={() => setWordShuffleTick((t) => t + 1)} className="flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-500 active:scale-95">
                    <RefreshCw size={12} /> Shuffle
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">Swap a word in your own phrase for a stronger one.</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">🔖 save to your vocab bank</p>
              {shownWords.length > 0 ? (
                <div className="mt-1 space-y-2" key={`${pinTick}-${wordShuffleTick}`}>
                  {shownWords.map((word) => {
                    const { from, to } = parsePowerWord(word);
                    const ctx = from ? wordContext(transcript, from) : null;
                    const context = ctx ? [ctx.before, from, ctx.after].filter(Boolean).join(" ") : undefined;
                    const saved = isVocabSaved(to);
                    return (
                      <div key={word} className="flex items-start gap-2 rounded-xl bg-gray-50/70 px-3 py-2 text-sm font-bold leading-relaxed text-gray-800">
                        <span className="min-w-0 flex-1">
                        {from ? (
                          <span>
                            {ctx?.before && <span className="text-gray-500">{ctx.before} </span>}
                            <span className="text-gray-400 line-through">{from}</span>{" "}
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">{to}</span>
                            {ctx?.after && <span className="text-gray-500"> {ctx.after}</span>}
                          </span>
                        ) : (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
                            <Sparkles size={10} className="mr-1 inline" />{to}
                          </span>
                        )}
                        </span>
                        <button
                          onClick={() => { toggleVocab({ from, to, context }); setPinTick((t) => t + 1); }}
                          aria-label={saved ? "Remove from vocab bank" : "Save to vocab bank"}
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${saved ? "bg-green-500 text-white" : "bg-white text-gray-300 shadow-sm"}`}
                        >
                          <Bookmark size={13} className={saved ? "fill-current" : ""} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm font-semibold text-gray-400">Speak a bit more next run and the coach will pick words to upgrade.</p>
              )}
            </section>

            {/* 🧱 SENTENCES — steal a real line and drop it into your talk */}
            <section className="rounded-[1.25rem] border-l-4 border-blue-400 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧱</span>
                  <p className="text-sm font-black text-gray-900">Sentences</p>
                </div>
                <button onClick={() => setStealLines(pickStealLines(2))} className="flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-500 active:scale-95">
                  <RefreshCw size={12} /> Shuffle
                </button>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">Steal a line and drop it into your talk.</p>
              {plan?.say_this && (
                <div className="mt-2 rounded-2xl bg-blue-50 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Your line, leveled up</p>
                  <p className="mt-1 text-sm font-black leading-relaxed text-gray-900">"{renderInline(plan.say_this)}"</p>
                </div>
              )}
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Lines from great speakers · 📌 pin for next practice</p>
              <div className="mt-1.5 space-y-1.5" key={pinTick}>
                {stealLines.map(({ quote, speaker }) => {
                  const saved = isLineSaved(quote);
                  return (
                    <div key={quote} className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-snug text-gray-700">"{quote}"</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-gray-400">— {speaker}</p>
                      </div>
                      <button
                        onClick={() => { toggleLine(quote, speaker); setPinTick((t) => t + 1); }}
                        aria-label={saved ? "Unpin line" : "Pin line for next practice"}
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${saved ? "bg-blue-500 text-white" : "bg-white text-gray-300 shadow-sm"}`}
                      >
                        <Pin size={13} className={saved ? "fill-current" : ""} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 🎬 STORYTELLING — shape your idea so it lands */}
            <section className="rounded-[1.25rem] border-l-4 border-purple-400 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">🎬</span>
                <p className="text-sm font-black text-gray-900">Storytelling</p>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">Shape your idea so it lands.</p>
              <div className="mt-2 space-y-1.5">
                {BUILD_OUT_SKELETON.map((step, i) => (
                  <div key={step} className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-black text-purple-600">{i + 1}</span>
                    <p className="text-sm font-bold leading-snug text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
              {takeaway.make_stronger.length > 0 && (
                <div className="mt-3 rounded-2xl bg-purple-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">This run's fix</p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-gray-800">{renderInline(takeaway.make_stronger[0].point)}</p>
                  {takeaway.make_stronger[0].quote && (
                    <p className="mt-1 text-xs font-semibold italic text-gray-500">You said: “{takeaway.make_stronger[0].quote}”</p>
                  )}
                </div>
              )}
              {plan?.one_move && (
                <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">🎯 Your next trying point</p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-gray-800">{renderInline(plan.one_move)}</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ═══════════ Your run in detail — collapsed by default ═══════════ */}
        {takeaway && (
          <details className="group rounded-[1.25rem] border border-gray-100 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black text-gray-700">
              <span className="flex items-center gap-2"><Blocks size={15} className="text-gray-400" />Your run in detail</span>
              <ChevronRight size={16} className="text-gray-300 transition-transform group-open:rotate-90" />
            </summary>
            <div className="space-y-4 px-4 pb-4">

              {/* what you talked about */}
              {takeaway.summary.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">What you talked about</p>
                  <div className="mt-2 space-y-1.5">
                    {takeaway.summary.map((point) => (
                      <div key={point} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                        <p className="text-sm font-bold leading-relaxed text-gray-800">{renderInline(point)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* a strength worth doing more of */}
              {takeaway.amplify.length > 0 && (
                <div>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-green-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-green-600">Do more of this</p>
                  </div>
                  <div className="mt-2 space-y-3">
                    {takeaway.amplify.map((item) => (
                      <div key={item.point}>
                        <p className="text-sm font-bold leading-relaxed text-gray-800">{renderInline(item.point)}</p>
                        {item.quote && (
                          <p className="mt-1 rounded-lg border-l-2 border-green-200 bg-green-50/70 px-2 py-1 text-xs font-semibold italic text-gray-500">
                            You said: “{item.quote}”
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* the rest of what they did well (the first is shown up top) */}
              {takeaway.what_worked.length > 1 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-500">More you did well</p>
                  <div className="mt-2 space-y-3">
                    {takeaway.what_worked.slice(1).map((item) => (
                      <div key={item.point}>
                        <p className="text-sm font-bold leading-relaxed text-gray-800">{renderInline(item.point)}</p>
                        {item.quote && (
                          <p className="mt-1 rounded-lg border-l-2 border-blue-200 bg-blue-50/60 px-2 py-1 text-xs font-semibold italic text-gray-500">
                            You said: “{item.quote}”
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* progress this run — the KTV numbers live here as private evidence */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Your progress this run</p>
                  <TrendingUp size={15} className="text-green-500" />
                </div>
                <div className="space-y-2.5">
                  {(["flow", "words", "sentences", "story"] as KTVMetric[]).map((metric) => {
                    const level = trendLevel(ktvScore[metric]);
                    const tag = level === "strong" ? "Strong" : level === "growing" ? "Growing" : "Just starting";
                    const tagStyle = level === "strong" ? "bg-green-50 text-green-600" : level === "growing" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400";
                    const { Icon, color } = KTV_META[metric];
                    return (
                      <div key={metric} className="flex items-center gap-2">
                        <Icon size={15} className="w-5 shrink-0" style={{ color }} />
                        <span className="w-16 shrink-0 text-xs font-bold text-gray-500">{KTV_META[metric].label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full" style={{ width: `${ktvScore[metric]}%`, backgroundColor: color }} />
                        </div>
                        <span className="w-7 text-right font-mono text-xs font-black" style={{ color }}>{Math.round(ktvScore[metric])}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${tagStyle}`}>{tag}</span>
                      </div>
                    );
                  })}
                </div>
                {ktvEvents.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-2">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-300">What moved</p>
                    <div className="space-y-1">
                      {ktvEvents.slice(0, 4).map((e) => (
                        <p key={e.id} className="text-xs font-semibold text-gray-500">
                          <span className="font-black text-green-600">+{e.delta} {KTV_META[e.metric].label}</span> · {e.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

        {/* ═══════════ Coach — collapsed by default ═══════════ */}
        <details className="group rounded-[1.25rem] border border-gray-100 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black text-gray-700">
            <span className="flex items-center gap-2">
              <MessageCircle size={15} className="text-blue-500" />Coach chatbox
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
                {chatStatus === "thinking" ? "thinking…" : hasSessionData ? "ready" : "practice first"}
              </span>
            </span>
            <ChevronRight size={16} className="text-gray-300 transition-transform group-open:rotate-90" />
          </summary>
          <div className="px-4 pb-4">

          <div className="h-[240px] overflow-y-auto rounded-2xl bg-gray-50 p-3" style={{ scrollbarWidth: "thin" }}>
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user"
                    ? "ml-10 rounded-2xl bg-blue-500 px-3 py-2 text-white"
                    : message.role === "system"
                    ? "rounded-2xl bg-amber-50 px-3 py-2 text-amber-700"
                    : "mr-8 rounded-2xl bg-white px-3 py-2 text-gray-800 shadow-sm"}
                >
                  <p className="whitespace-pre-line text-sm font-semibold leading-relaxed">{renderInline(message.text)}</p>
                </div>
              ))}
              {chatStatus === "thinking" && <div className="mr-8 h-9 animate-pulse rounded-2xl bg-white shadow-sm" />}
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => void askCoach(preset.prompt)}
                disabled={!hasSessionData || chatStatus === "thinking"}
                className="flex shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 disabled:opacity-45"
              >
                {preset.label}<ChevronRight size={12} />
              </button>
            ))}
          </div>

          <form
            className="mt-3 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              void askCoach(chatInput);
            }}
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-300"
              placeholder="Ask for a question, your highlight, better words…"
              disabled={!hasSessionData || chatStatus === "thinking"}
            />
            <button type="submit" disabled={!chatInput.trim() || !hasSessionData || chatStatus === "thinking"} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-45">
              <Send size={15} />
            </button>
          </form>
          </div>
        </details>

        <div className="flex gap-3 pt-1">
          <button onClick={() => navigate("/practice")} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-md active:scale-95" style={{ background: "linear-gradient(135deg, #58A9FF, #7ED957)" }}>
            <RotateCcw size={18} />Practice Again
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-bold text-gray-700 shadow-sm active:scale-95">
            <BookOpen size={16} />Start
          </button>
        </div>
      </div>
      <AppTabBar />
    </div>
  );
}
