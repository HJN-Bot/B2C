import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Blocks, BookOpen, Brain, ChevronRight, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, TrendingUp, Waves, Wrench, type LucideIcon } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";
import { callGeminiProxy } from "@/lib/gemini-proxy";
import { getPracticeMode } from "@/lib/practice-mode";
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
  story: { label: "Story", Icon: Brain, color: "#7C3AED" },
};


const PRESETS = [
  { label: "Ask me one question", prompt: "Ask me ONE short question about my topic so I can practice answering it next time. Do not answer it for me." },
  { label: "My highlight", prompt: "What was the single best moment in what I just said, and why did it work?" },
  { label: "Level up my words", prompt: "Give me 3 stronger words or phrases I can reuse next time, each with one short example sentence." },
  { label: "Make my story fun", prompt: "Give me one small idea to make my story more interesting next time, based on what I said." },
  { label: "Shape my story", prompt: "Help me shape my idea into claim, example, and why it matters — using my own words, not a full script." },
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
  return `You are SpeakSpark, an AI speaking coach for Chinese middle-school students practicing English science presentations.
${coachStyle}

First UNDERSTAND what the student was actually arguing — read the whole transcript as a real talk on a real topic, not a bag of words. Then coach with advice tied to THAT topic and to their KTV scores.
Rules:
- Use ONLY ideas supported by the transcript, highlights, and score events. Never invent a topic. If the transcript is too thin to tell the topic, say so plainly instead of guessing.
- "summary": 1-2 COMPLETE SENTENCES naming the actual topic and the point they were making (e.g. "You explained how renewable energy could replace coal, and gave wind power as an example."). NEVER output a list of disconnected words.
- The "encouragement" should be warm and a little playful, not a score.
- "reuse_words": 3-5 SYNONYM UPGRADES — for words the student actually used, give a stronger/more precise alternative fitting their topic. Format each as "their word → upgrade" (e.g. "good → remarkable", "a lot of → a vast amount of"). Pick words they really said.
- "say_this": rewrite ONE real sentence the student said into a higher-level version of THE SAME point — keep their meaning, upgrade the structure/connectors (e.g. "X is significant because…", "One striking example is…"). It must read as a coherent sentence about their topic, never echo a single keyword.
- Tie advice to "ktv_score": find the LOWEST metric and aim "focus", "one_move" and "make_stronger" at it — flow=keep one idea going, words=stronger/precise vocabulary, sentences=fuller complete sentences, story=claim+example+why it matters. NAME the metric in the advice so it feels custom (e.g. "Your Story score is lowest — add why it matters").
- "amplify": the metric/skill they did BEST on, with how to do even more of it next time.
- For every "what_worked", "amplify" and "make_stronger" item, include a SHORT exact quote (3-8 words) copied verbatim from the transcript as "quote". If no fitting quote exists, use "".

Return ONLY valid JSON:
{
  "encouragement": "one warm, playful sentence",
  "summary": ["1-2 full sentences naming the real topic and their point"],
  "next_run_plan": {
    "focus": "one specific focus, naming the lowest KTV metric",
    "say_this": "their own sentence upgraded — same point, stronger structure (not a repeat, not a keyword)",
    "reuse_words": ["3-5 'their word → stronger synonym' upgrades, drawn from words they used"],
    "one_move": "one tiny concrete action for the next run, aimed at the lowest metric"
  },
  "what_worked": [{ "point": "what they did well", "quote": "exact short phrase they said, or empty" }],
  "amplify": [{ "point": "the skill/metric they did best on and how to do more of it", "quote": "the phrase it builds on, or empty" }],
  "make_stronger": [{ "point": "one thing to change, tied to the lowest metric (name it)", "quote": "the phrase this refers to, or empty" }]
}

Session:
${context}`;
}

function buildChatSystemPrompt(context: string, takeaway: AiTakeaway | null, coachStyle: string) {
  return `You are SpeakSpark's post-practice coach for a Chinese middle-school student.
${coachStyle}
Answer ONLY based on this session. Keep answers short, concrete, and next-run focused.
Coach mode: practice feedback only. Never write a full speech or a complete answer for the student — coach by asking one question, giving a frame, or offering small reusable pieces (words, examples).
If the student asks you to "ask me a question", ask exactly ONE short question and do NOT answer it yourself.
ALWAYS return ONLY valid JSON: { "answer": "2-5 short lines" }

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
        maxOutputTokens: 1600,
        contents: [{ role: "user", parts: [{ text: buildTakeawayPrompt(sessionContext, practiceMode.coachStyle) }] }],
      });
      const parsed = normalizeTakeaway(parseJson<Partial<AiTakeaway>>(text));
      if (!parsed) throw new Error("AI returned an unreadable takeaway format");
      setTakeaway(parsed);
      setTakeawayStatus("ready");
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
        maxOutputTokens: 900,
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

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex min-h-dvh flex-col gap-4 overflow-y-auto px-4 pb-28 pt-6">
        {/* ═══════════ BLOCK ① Summary & encouragement ═══════════ */}
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-white">1</span>
          <h2 className="text-lg font-black text-gray-900">Your run</h2>
        </div>

        <section className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-amber-500">Practice complete</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black leading-tight text-gray-900">
                {celebrationHeadline(timer)}
              </h1>
              <p className="mt-2 text-sm font-semibold text-gray-400">
                {(highlightWords.length || highlightCount) ? `${highlightWords.length || highlightCount} phrases saved` : "First steps saved"} · {wordCount || "some"} words spoken
              </p>
            </div>
            <div className="text-5xl">🎉</div>
          </div>
          {takeaway?.encouragement && (
            <p className="mt-3 rounded-2xl bg-amber-50/70 px-3 py-2.5 text-sm font-bold leading-relaxed text-amber-700">
              {takeaway.encouragement}
            </p>
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

        {/* One quick win up top — the full detail lives in block ③ below, so we
            lead with affirmation but don't bury the Level-up plan. */}
        {takeaway && takeaway.what_worked.length > 0 && (
          <section className="rounded-[1.25rem] border border-blue-100 bg-blue-50/40 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-500">One thing you did well</p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-800">{takeaway.what_worked[0].point}</p>
            {takeaway.what_worked[0].quote && (
              <p className="mt-1 rounded-lg border-l-2 border-blue-200 bg-blue-50/70 px-2 py-1 text-xs font-semibold italic text-gray-500">
                You said: “{takeaway.what_worked[0].quote}”
              </p>
            )}
          </section>
        )}

        {/* ═══════════ BLOCK ② Level up — amplify + change + plan ═══════════ */}
        <div className="flex items-center gap-2 px-1 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-black text-white">2</span>
          <h2 className="text-lg font-black text-gray-900">Level up</h2>
        </div>

        {/* When the AI failed we fell back to generic templates — don't dress
            those up as real, personalized advice; show one honest card instead. */}
        {takeawayError && takeawayStatus === "ready" ? (
          <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-amber-700">
              <AlertTriangle size={15} />
              Personalized advice needs the coach AI
            </div>
            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-amber-600">
              The AI didn't respond this run, so we're not inventing tips that don't match what you said. Your scores in "Your run in detail" below are real — tap to get the AI plan.
            </p>
            <button onClick={() => void generateTakeaway()} className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-black text-amber-700 shadow-sm active:scale-95">
              Try again
            </button>
          </section>
        ) : (
        <>
        {/* Amplify — a strength worth doing MORE of */}
        {takeaway && takeaway.amplify.length > 0 && (
          <section className="rounded-[1.25rem] border border-green-100 bg-green-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={16} className="text-green-600" />
              <p className="text-xs font-black uppercase tracking-widest text-green-600">Amplify · do more of this</p>
            </div>
            <div className="mt-2 max-h-48 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {takeaway.amplify.map((item) => (
                <div key={item.point}>
                  <p className="text-sm font-bold leading-relaxed text-gray-800">{item.point}</p>
                  {item.quote && (
                    <p className="mt-1 rounded-lg border-l-2 border-green-200 bg-green-50/70 px-2 py-1 text-xs font-semibold italic text-gray-500">
                      You said: “{item.quote}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Change — one thing to fix */}
        {takeaway && takeaway.make_stronger.length > 0 && (
          <section className="rounded-[1.25rem] border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-orange-500" />
              <p className="text-xs font-black uppercase tracking-widest text-orange-500">Change · one thing to fix</p>
            </div>
            <div className="mt-2 max-h-48 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {takeaway.make_stronger.map((item) => (
                <div key={item.point}>
                  <p className="text-sm font-bold leading-relaxed text-gray-800">{item.point}</p>
                  {item.quote && (
                    <p className="mt-1 rounded-lg border-l-2 border-orange-200 bg-orange-50/60 px-2 py-1 text-xs font-semibold italic text-gray-500">
                      You said: “{item.quote}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How to say it next time */}
        <section className="rounded-[1.25rem] border border-green-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-green-500">Next time, say it like this</p>
            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-green-600">
              {takeawayStatus === "thinking" ? "Thinking…" : takeawayStatus === "idle" ? "Practice first" : "From this run"}
            </span>
          </div>

          {takeawayStatus === "idle" && (
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="text-sm font-bold leading-relaxed text-blue-700">Finish one practice run first. Then this becomes a real AI plan.</p>
              <button onClick={() => navigate("/practice")} className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-600 shadow-sm">
                Start practice
              </button>
            </div>
          )}

          {takeawayStatus === "thinking" && (
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-100" />
              <div className="h-14 animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-100" />
            </div>
          )}

          {takeawayStatus === "error" && (
            <div className="rounded-2xl bg-gray-50 p-3">
              <p className="text-sm font-bold text-gray-700">Coach plan is ready from this run.</p>
              <button onClick={() => void generateTakeaway()} className="mt-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-black text-gray-500 shadow-sm">
                Refresh plan
              </button>
            </div>
          )}

          {plan && takeawayStatus === "ready" && (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-300">Focus</p>
                <p className="mt-1 text-sm font-black leading-relaxed text-gray-900">{plan.focus}</p>
              </div>
              <div className="rounded-2xl bg-green-50 px-3 py-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-green-600">Say this next</p>
                <div className="mt-1 max-h-24 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  <p className="text-sm font-black leading-relaxed text-gray-900">"{plan.say_this}"</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {plan.reuse_words.map((word) => (
                  <span key={word} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">
                    <Sparkles size={10} className="mr-1 inline" />{word}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">🎯 Your next trying point</p>
                <div className="mt-1 max-h-20 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  <p className="text-sm font-bold leading-relaxed text-gray-800">{plan.one_move}</p>
                </div>
              </div>
            </div>
          )}
        </section>
        </>
        )}

        {/* ═══════════ BLOCK ③ Your run in detail — moved below Level up ═══════════ */}
        <div className="flex items-center gap-2 px-1 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs font-black text-white">3</span>
          <h2 className="text-lg font-black text-gray-900">Your run in detail</h2>
        </div>

        {/* what you talked about */}
        {takeaway && takeaway.summary.length > 0 && (
          <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">What you talked about</p>
            <div className="mt-2 space-y-1.5">
              {takeaway.summary.map((point) => (
                <div key={point} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  <p className="text-sm font-bold leading-relaxed text-gray-800">{point}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* the rest of what you did well (the first one is shown up top) */}
        {takeaway && takeaway.what_worked.length > 1 && (
          <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-500">More you did well</p>
            <div className="mt-2 max-h-48 space-y-3 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {takeaway.what_worked.slice(1).map((item) => (
                <div key={item.point}>
                  <p className="text-sm font-bold leading-relaxed text-gray-800">{item.point}</p>
                  {item.quote && (
                    <p className="mt-1 rounded-lg border-l-2 border-blue-200 bg-blue-50/60 px-2 py-1 text-xs font-semibold italic text-gray-500">
                      You said: “{item.quote}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Your progress this run — scores + what moved */}
        {takeaway && (
          <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
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
          </section>
        )}

        {/* ═══════════ BLOCK ④ Coach — chatbox + go again ═══════════ */}
        <div className="flex items-center gap-2 px-1 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">4</span>
          <h2 className="text-lg font-black text-gray-900">Coach</h2>
        </div>

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-500" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Coach chatbox</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">
              {chatStatus === "thinking" ? "Coach thinking…" : hasSessionData ? "Coach ready" : "Practice first"}
            </span>
          </div>

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
                  <p className="whitespace-pre-line text-sm font-semibold leading-relaxed">{message.text}</p>
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
        </section>

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
