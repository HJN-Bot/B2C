import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } from "@google/generative-ai";
import { BookOpen, ChevronRight, MessageCircle, RotateCcw, Send, Sparkles, Star, TrendingUp } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";
import { supabase } from "@/integrations/supabase/client";

const MODEL_NAME = "gemini-2.5-flash";
const GEMINI_KEY_CACHE = "meaningfully.geminiApiKey";
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

interface AiTakeaway {
  encouragement: string;
  next_run_plan: NextRunPlan;
  what_worked: string[];
  make_stronger: string[];
}

interface CoachMessage {
  id: string;
  role: "coach" | "user" | "system";
  text: string;
}

const KTV_META: Record<KTVMetric, { label: string; icon: string }> = {
  flow: { label: "Flow", icon: "🌊" },
  words: { label: "Words", icon: "📚" },
  sentences: { label: "Sentences", icon: "🧩" },
  story: { label: "Story", icon: "🧠" },
};

const TAKEAWAY_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    encouragement: { type: SchemaType.STRING },
    next_run_plan: {
      type: SchemaType.OBJECT,
      properties: {
        focus: { type: SchemaType.STRING },
        say_this: { type: SchemaType.STRING },
        reuse_words: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        one_move: { type: SchemaType.STRING },
      },
      required: ["focus", "say_this", "reuse_words", "one_move"],
    },
    what_worked: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    make_stronger: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["encouragement", "next_run_plan", "what_worked", "make_stronger"],
};

const CHAT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: { answer: { type: SchemaType.STRING } },
  required: ["answer"],
};

const PRESETS = [
  { label: "Vocab upgrade", prompt: "Give me 3 better words or phrases I can use next time, with one easy sentence." },
  { label: "Storyline", prompt: "Turn my idea into claim, example, evidence, and impact." },
  { label: "Go deeper", prompt: "Ask me 3 deeper science questions about my topic." },
  { label: "More examples", prompt: "Give me 2 simple examples I can add next time." },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  return mins > 0 ? `${mins}m ${seconds % 60}s` : `${seconds}s`;
}

function scoreColor(value: number) {
  if (value < 40) return "#FF7A5C";
  if (value < 70) return "#FFC947";
  if (value < 90) return "#7ED957";
  return "#58A9FF";
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

function normalizeTakeaway(value: Partial<AiTakeaway> | null): AiTakeaway | null {
  const plan = value?.next_run_plan;
  if (!plan?.focus || !plan?.say_this || !plan?.one_move) return null;
  return {
    encouragement: String(value?.encouragement || "You completed a real practice run.").trim(),
    next_run_plan: {
      focus: String(plan.focus).trim(),
      say_this: String(plan.say_this).trim(),
      reuse_words: normalizeList(plan.reuse_words, []),
      one_move: String(plan.one_move).trim(),
    },
    what_worked: normalizeList(value?.what_worked, ["You gave the coach real content to build from."]).slice(0, 3),
    make_stronger: normalizeList(value?.make_stronger, [String(plan.one_move)]).slice(0, 3),
  };
}

function buildTakeawayPrompt(context: string) {
  return `You are SpeakSpark, an AI speaking coach for Chinese middle-school students practicing English science presentations.

Create a concise post-practice takeaway. Do not repeat the full transcript.
Focus on what the student should do in the NEXT speaking run.
Use only ideas supported by the transcript, highlights, and score events.

Return ONLY valid JSON:
{
  "encouragement": "one warm sentence",
  "next_run_plan": {
    "focus": "one specific focus",
    "say_this": "one short sentence or frame the student can say next time",
    "reuse_words": ["2-4 words or phrases"],
    "one_move": "one tiny action for the next run"
  },
  "what_worked": ["2-3 concrete bullets"],
  "make_stronger": ["2-3 concrete bullets"]
}

Session:
${context}`;
}

function buildChatPrompt(context: string, takeaway: AiTakeaway | null, request: string) {
  return `You are SpeakSpark's post-practice coach. Answer the student's request with concrete next-run help.
Keep it short and usable. Do not pretend to know anything outside this session.

Return ONLY valid JSON:
{ "answer": "2-5 short lines" }

Request: ${request}

Current takeaway:
${takeaway ? JSON.stringify(takeaway, null, 2) : "Not generated yet."}

Session:
${context}`;
}

export default function TakeawayPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const genAiRef = useRef<GoogleGenerativeAI | null>(null);
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

  const ensureGemini = useCallback(async () => {
    if (genAiRef.current) return genAiRef.current;

    const cachedKey = window.sessionStorage.getItem(GEMINI_KEY_CACHE);
    if (cachedKey) {
      genAiRef.current = new GoogleGenerativeAI(cachedKey);
      return genAiRef.current;
    }

    const { data, error } = await supabase.functions.invoke("get-gemini-api-key", {});
    if (error) throw new Error(`Gemini key function failed: ${error.message || "Edge Function request failed"}`);
    const key = data?.geminiApiKey;
    if (!key) throw new Error("No Gemini API key returned");
    window.sessionStorage.setItem(GEMINI_KEY_CACHE, key);
    genAiRef.current = new GoogleGenerativeAI(key);
    return genAiRef.current;
  }, []);

  const getModel = useCallback(async (schema: object) => {
    const genAi = await ensureGemini();
    return genAi.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens: 900,
        temperature: 0.68,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
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
      const model = await getModel(TAKEAWAY_SCHEMA);
      const result = await model.generateContent(buildTakeawayPrompt(sessionContext));
      const parsed = normalizeTakeaway(parseJson<Partial<AiTakeaway>>(result.response.text()));
      if (!parsed) throw new Error("AI returned an unreadable takeaway format");
      setTakeaway(parsed);
      setTakeawayStatus("ready");
      setChatMessages([
        { id: makeId(), role: "coach", text: parsed.encouragement },
        { id: makeId(), role: "coach", text: `Next focus: ${parsed.next_run_plan.focus}` },
      ]);
      setChatStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI error";
      setTakeawayStatus("error");
      setTakeawayError(message);
      setChatStatus("error");
      setChatMessages([{ id: makeId(), role: "system", text: `AI plan did not load. ${message}` }]);
    }
  }, [getModel, hasSessionData, sessionContext]);

  const askCoach = useCallback(async (request: string) => {
    const trimmed = request.trim();
    if (!trimmed || !hasSessionData || chatStatus === "thinking") return;

    setChatInput("");
    setChatStatus("thinking");
    setChatMessages((prev) => [...prev, { id: makeId(), role: "user", text: trimmed }]);
    try {
      const model = await getModel(CHAT_SCHEMA);
      const result = await model.generateContent(buildChatPrompt(sessionContext, takeaway, trimmed));
      const parsed = parseJson<{ answer?: string }>(result.response.text());
      if (!parsed?.answer?.trim()) throw new Error("AI returned an unreadable chat answer");
      setChatMessages((prev) => [...prev, { id: makeId(), role: "coach", text: parsed.answer!.trim() }]);
      setChatStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI chat failed";
      setChatMessages((prev) => [...prev, { id: makeId(), role: "system", text: message }]);
      setChatStatus("error");
    }
  }, [chatStatus, getModel, hasSessionData, sessionContext, takeaway]);

  useEffect(() => {
    void generateTakeaway();
  }, [generateTakeaway]);

  const plan = takeaway?.next_run_plan;

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex min-h-dvh flex-col gap-4 overflow-y-auto px-4 pb-28 pt-6">
        <section className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-amber-500">You made it</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black leading-tight text-gray-900">
                Your idea stayed alive for {formatTime(timer)}.
              </h1>
              <p className="mt-2 text-sm font-semibold text-gray-400">
                {highlightCount} moments saved · {wordCount || "some"} words captured
              </p>
            </div>
            <div className="text-5xl">🏆</div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          {[
            { label: "Time", value: formatTime(timer) },
            { label: "Words", value: wordCount || "--" },
            { label: "Saved", value: highlightWords.length || highlightCount || "--" },
            { label: "AI", value: takeawayStatus === "ready" ? "On" : takeawayStatus === "thinking" ? "..." : "--" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-100 bg-white px-2 py-3 text-center shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{item.label}</p>
              <p className="mt-1 text-lg font-black text-gray-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[1.25rem] border border-green-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-green-500">Next Run Plan</p>
            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-green-600">
              {takeawayStatus === "ready" ? "AI thought" : takeawayStatus === "thinking" ? "AI thinking" : takeawayStatus === "idle" ? "Practice first" : "Retry needed"}
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
            <div className="rounded-2xl bg-red-50 p-3">
              <p className="text-sm font-bold text-red-600">AI plan did not load.</p>
              <p className="mt-1 max-h-14 overflow-y-auto text-xs font-semibold text-red-400">{takeawayError}</p>
              <button onClick={() => void generateTakeaway()} className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-red-500 shadow-sm">
                Generate again
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
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">One move</p>
                <div className="mt-1 max-h-20 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  <p className="text-sm font-bold leading-relaxed text-gray-800">{plan.one_move}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {takeaway && (
          <section className="grid grid-cols-1 gap-3">
            {[
              ["What worked", takeaway.what_worked, "text-blue-500"],
              ["Make stronger", takeaway.make_stronger, "text-orange-500"],
            ].map(([title, items, color]) => (
              <div key={title as string} className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
                <p className={`text-xs font-black uppercase tracking-widest ${color}`}>{title as string}</p>
                <div className="mt-2 max-h-32 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {(items as string[]).map((item) => <p key={item} className="text-sm font-bold leading-relaxed text-gray-800">{item}</p>)}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-500" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Coach chatbox</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">
              {chatStatus === "thinking" ? "AI thinking" : hasSessionData ? "AI ready" : "Practice first"}
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
                    ? "rounded-2xl bg-red-50 px-3 py-2 text-red-600"
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
              placeholder="Ask for vocab, storyline, depth..."
              disabled={!hasSessionData || chatStatus === "thinking"}
            />
            <button type="submit" disabled={!chatInput.trim() || !hasSessionData || chatStatus === "thinking"} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-45">
              <Send size={15} />
            </button>
          </form>
        </section>

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Progress map</p>
            <TrendingUp size={15} className="text-green-500" />
          </div>
          <div className="space-y-3">
            {(["flow", "words", "sentences", "story"] as KTVMetric[]).map((metric) => (
              <div key={metric} className="flex items-center gap-2">
                <span className="w-5 text-center text-sm">{KTV_META[metric].icon}</span>
                <span className="w-20 text-xs font-bold text-gray-500">{KTV_META[metric].label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${ktvScore[metric]}%`, background: scoreColor(ktvScore[metric]) }} />
                </div>
                <span className="w-7 text-right font-mono text-xs font-black" style={{ color: scoreColor(ktvScore[metric]) }}>{Math.round(ktvScore[metric])}</span>
              </div>
            ))}
          </div>
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
