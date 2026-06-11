import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, MessageCircle, Sparkles, Star, StopCircle, Zap } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";
import { callGeminiProxy } from "@/lib/gemini-proxy";
import { getPracticeMode } from "@/lib/practice-mode";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_NAME             = "gemini-2.5-flash";
const ENERGY_THRESHOLD       = 0.003;
const SILENCE_DURATION_MSEC  = 650;
const TARGET_SAMPLE_RATE     = 16000;
const BUFFER_SIZE            = 1024;
const MIN_PHRASE_SECONDS     = 0.9;
const MAX_PHRASE_SECONDS     = 3.0;
const BOTTLENECK_SILENCE_MS  = 3000;
const PASSIVE_HIGHLIGHT_COOLDOWN_MS = 2600;
const MAX_SESSION_HIGHLIGHT_WORDS = 8;

// ─── Gemini prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a real-time AI speaking partner helping a middle school student practice an English science presentation.

Listen to the audio carefully. Judge ONLY from what the student actually said in this chunk and the prior chat context.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "transcript": "exact transcription of what was said",
  "feedback": "1 specific, natural reaction under 10 words. Do not ask a question here.",
  "highlight_words": ["advanced", "less common", "academic", "scientific", "or vivid words the student actually used"],
  "follow_up": "ALWAYS prepare the single best thing to say IF the student paused right now — one short question OR one improvement nudge, <=16 words, referencing what they just said",
  "kind": "question",
  "mood": "excited",
  "highlight_moment": false,
  "score_delta": { "flow": 0, "words": 0, "sentences": 0, "story": 0 }
}

Rules:
- transcript: accurate transcription only, no extra commentary
- feedback must mention a real word, idea, evidence, transition, or behavior from the audio. Avoid generic phrases like "good point" or "nice job". Keep it warm and human, not robotic.
- highlight_words: include only words or short phrases present in transcript. Prefer words the student may not commonly use.
- follow_up: ALWAYS fill it (it is pre-buffered, not shown unless they pause). Base it on what they just said: a real next question, or a direction to improve. Never generic praise.
- kind: "question" if follow_up is a question, "nudge" if it's an improvement direction.
- mood: "excited" if strong phrases used | "thinking" if short/stuck | "listening" otherwise
- highlight_moment: true only when the student says a strong claim, vivid explanation, evidence, or unusually good vocabulary.
- score_delta: small integers 0-8 based on the real chunk. words should rise only for real highlighted words. sentences should rise for modal clauses, causal structures, comparisons, passive voice, or complex grammar. story should rise when the student develops claim/example/evidence/impact.
`;

const FOLLOW_UP_PROMPT = `The student has paused for several seconds during their English science presentation practice.

React like a real coach: based on WHAT THEY ACTUALLY SAID, either ask one question OR point one direction to improve.

Respond ONLY with valid JSON:
{
  "kind": "question" | "nudge",
  "follow_up": "if kind=question, one question; if kind=nudge, one improvement direction. <=16 words, MUST reference something they said.",
  "feedback": "one short human observation tied to their own words",
  "mood": "thinking"
}

Use the transcript/context from this chat. Reference the student's own words; avoid generic praise. If there is little context, ask a useful starter question about cause, example, evidence, or impact.
`;

// Tiny human "I'm here, thinking" beats shown the instant the user pauses,
// before the real content-aware reply arrives.
const THINKING_ACKS = ["mm… let me think", "okay, hold on", "I'm with you…", "got it, one sec"];

// ─── Types ────────────────────────────────────────────────────────────────────

type CharacterMood = "idle" | "listening" | "excited" | "thinking" | "coaching";

interface GeminiResult {
  transcript?: string;
  feedback?: string;
  highlight_words?: string[];
  follow_up?: string;
  kind?: "question" | "nudge";
  mood?: string;
  highlight_moment?: boolean;
  score_delta?: Partial<KTVScore>;
  error?: string;
}

interface KTVScore { flow: number; words: number; sentences: number; story: number }
type KTVMetric = keyof KTVScore;
interface KTVEvent { id: number; metric: KTVMetric; delta: number; reason: string }
interface HighlightFlash { id: number; points: number; label?: string; tone?: "highlight" | "milestone" }
interface PhraseSpark { id: number; text: string; source: "caption" | "ai" }

const KTV_META: Record<KTVMetric, { label: string; short: string; icon: string; purpose: string }> = {
  flow: { label: "Flow", short: "Flow", icon: "🌊", purpose: "keep talking" },
  words: { label: "Words", short: "Words", icon: "📚", purpose: "strong phrases" },
  sentences: { label: "Sentences", short: "Syntax", icon: "🧩", purpose: "better forms" },
  story: { label: "Story", short: "Story", icon: "🧠", purpose: "complete point" },
};

const KTV_ITEMS: Array<{ key: KTVMetric; label: string; short: string; icon: string; purpose: string }> = [
  { key: "flow", ...KTV_META.flow },
  { key: "words", ...KTV_META.words },
  { key: "sentences", ...KTV_META.sentences },
  { key: "story", ...KTV_META.story },
];

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

// ─── Audio helpers (from Practice.tsx) ───────────────────────────────────────

function float32To16BitPCM(float32Array: Float32Array): DataView {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return new DataView(pcm16.buffer);
}

function getWavHeader(dataByteLength: number, sampleRate: number): DataView {
  const buffer = new ArrayBuffer(44);
  const view   = new DataView(buffer);
  const ws = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataByteLength, true);
  ws(8, 'WAVE'); ws(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); ws(36, 'data');
  view.setUint32(40, dataByteLength, true);
  return view;
}

function createWavBlob(float32Array: Float32Array, sampleRate: number): Blob {
  const pcm = float32To16BitPCM(float32Array);
  const hdr = getWavHeader(pcm.buffer.byteLength, sampleRate);
  return new Blob([hdr, pcm], { type: 'audio/wav' });
}

function concatenate(arrays: Float32Array[]): Float32Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out   = new Float32Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function parseGeminiJson(text: string): GeminiResult | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as GeminiResult;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as GeminiResult;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function uniqueCleanWords(words: string[]) {
  const unique: string[] = [];
  for (const word of words.map((item) => item.trim()).filter(Boolean)) {
    if (!unique.some((seen) => seen.toLowerCase() === word.toLowerCase())) unique.push(word);
  }
  return unique.slice(-MAX_SESSION_HIGHLIGHT_WORDS);
}

const HIGHLIGHT_STOP_WORDS = new Set([
  "the", "and", "but", "for", "with", "from", "this", "that", "these", "those",
  "there", "their", "about", "because", "when", "where", "what", "which", "would",
  "could", "should", "really", "very", "just", "like", "think", "maybe", "actually",
  "also", "then", "than", "into", "onto", "have", "has", "had", "was", "were",
  "are", "you", "your", "our", "can", "will", "its", "it's", "they", "them",
  "say", "said", "make", "made", "thing", "things", "something", "important",
  "interesting", "different", "people", "student", "students", "english", "practice",
]);

const HIGH_VALUE_PHRASES = [
  { phrase: "artificial intelligence", score: 6 },
  { phrase: "machine learning", score: 6 },
  { phrase: "climate change", score: 5 },
  { phrase: "global warming", score: 5 },
  { phrase: "greenhouse gas", score: 5 },
  { phrase: "carbon dioxide", score: 5 },
  { phrase: "renewable energy", score: 6 },
  { phrase: "solar energy", score: 5 },
  { phrase: "wind power", score: 5 },
  { phrase: "fossil fuels", score: 5 },
  { phrase: "water pollution", score: 5 },
  { phrase: "air pollution", score: 5 },
  { phrase: "plays an important role", score: 4 },
  { phrase: "has a significant impact", score: 5 },
  { phrase: "in a unique way", score: 5 },
  { phrase: "for example", score: 3 },
  { phrase: "this leads to", score: 4 },
  { phrase: "as a result", score: 4 },
];

const HIGH_VALUE_WORDS: Record<string, number> = {
  unique: 7,
  incredible: 7,
  significant: 6,
  sustainable: 6,
  efficient: 5,
  efficiency: 5,
  innovative: 6,
  innovation: 6,
  crucial: 5,
  essential: 5,
  beneficial: 5,
  harmful: 4,
  renewable: 6,
  biodiversity: 7,
  ecosystem: 6,
  hypothesis: 6,
  evidence: 5,
  algorithm: 6,
  conservation: 6,
  microplastics: 7,
  photosynthesis: 7,
  evolution: 5,
  genetic: 5,
  environment: 4,
  pollution: 4,
};

const SENTENCE_PATTERNS: Array<{ pattern: RegExp; label: string; delta: number }> = [
  { pattern: /\b(could|should|would|might|may|can)\b[^.?!]{8,}/i, label: "modal sentence", delta: 3 },
  { pattern: /\b(because|therefore|so|as a result|this leads to|this means that)\b/i, label: "cause-effect sentence", delta: 4 },
  { pattern: /\b(if|when|which|that|although|while)\b[^.?!]{8,}/i, label: "complex sentence", delta: 3 },
  { pattern: /\b(is|are|was|were|be|been) [a-z]+ed\b/i, label: "passive structure", delta: 3 },
  { pattern: /\b(more|less|better|worse|bigger|smaller|faster|slower) than\b/i, label: "comparison", delta: 3 },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBasicHighlightCandidates(text: string) {
  const candidates: Array<{ text: string; score: number }> = [];
  const lower = text.toLowerCase();

  for (const { phrase, score } of HIGH_VALUE_PHRASES) {
    const match = lower.match(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i"));
    if (match) candidates.push({ text: match[0], score });
  }

  for (const [word, score] of Object.entries(HIGH_VALUE_WORDS)) {
    const match = text.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, "i"));
    if (match) candidates.push({ text: match[0], score });
  }

  const tokens = text.match(/[A-Za-z][A-Za-z'-]{7,}/g) || [];
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (!HIGHLIGHT_STOP_WORDS.has(normalized) && !HIGH_VALUE_WORDS[normalized]) {
      candidates.push({ text: token, score: 1 });
    }
  }

  const ranked = candidates
    .sort((a, b) => b.score - a.score || b.text.length - a.text.length)
    .map((candidate) => candidate.text);

  return uniqueCleanWords(ranked).slice(0, 3);
}

function detectSentencePattern(text: string) {
  return SENTENCE_PATTERNS.find(({ pattern }) => pattern.test(text));
}

// Layer-1 fast local pause reply: content-aware (not canned), so it can show
// instantly while a deeper Gemini reply is still loading.
function localPauseReply(transcript: string, words: string[]): { follow_up: string; feedback: string; kind: "question" | "nudge" } {
  const tail = transcript.replace(/\s+/g, " ").trim();
  if (/\b(because|so|therefore|for example|for instance|this shows|this means)\b/i.test(tail.slice(-90))) {
    return { kind: "nudge", feedback: "You started to explain your point.", follow_up: "Finish that thought — what's the example, or the why?" };
  }
  const lastWord = words[words.length - 1];
  if (lastWord) {
    return { kind: "question", feedback: `You used "${lastWord}".`, follow_up: `Can you give one real example of ${lastWord}?` };
  }
  const lastSentence = (tail.match(/[^.!?]+[.!?]*/g) || [tail]).pop()?.trim();
  if (lastSentence && lastSentence.length > 24) {
    return { kind: "question", feedback: "Good start.", follow_up: `Why does "${lastSentence.slice(0, 40)}…" matter?` };
  }
  return { kind: "question", feedback: "Let's keep it going.", follow_up: "What's one example, one reason, or one impact you can add?" };
}

// ─── Helper: highlight vocab in transcript text ───────────────────────────────

function applyHighlights(text: string, words: string[]) {
  if (!words.length) return [{ str: text, hl: false }];
  const parts: { str: string; hl: boolean }[] = [];
  let rem = text;
  while (rem.length > 0) {
    let earliest = -1, matchWord = "";
    for (const w of words) {
      const idx = rem.toLowerCase().indexOf(w.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) { earliest = idx; matchWord = w; }
    }
    if (earliest === -1) { parts.push({ str: rem, hl: false }); break; }
    if (earliest > 0) parts.push({ str: rem.slice(0, earliest), hl: false });
    parts.push({ str: rem.slice(earliest, earliest + matchWord.length), hl: true });
    rem = rem.slice(earliest + matchWord.length);
  }
  return parts;
}

// Cold-start helper: pull a few content keywords from the topic so the user
// has something to grab onto before they start (feedback #3).
const TOPIC_STOPWORDS = new Set([
  "how", "why", "what", "does", "make", "makes", "the", "are", "and", "for", "its",
  "our", "can", "you", "your", "that", "this", "with", "into", "when", "they", "from", "about",
]);
function topicKeywords(topic: string): string[] {
  if (!topic) return [];
  return Array.from(new Set(
    topic.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !TOPIC_STOPWORDS.has(w)),
  )).slice(0, 5);
}

// Teleprompter: the last n sentence-ish lines for a fixed-height window.
// The last item is the "current" line (locked in the middle); earlier ones
// sit above it, dimmed, and scroll off the top.
function recentLines(transcript: string, n = 3): string[] {
  const t = transcript.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const sentences = (t.match(/[^.!?]+[.!?]*/g) || [t]).map((s) => s.trim()).filter(Boolean);
  const capped = sentences.map((s) => {
    const w = s.split(" ");
    return w.length > 14 ? "…" + w.slice(-14).join(" ") : s;
  });
  return capped.slice(-n);
}

// ─── AI Character ─────────────────────────────────────────────────────────────

function AICharacter({
  mood,
  bubble,
  statusLine,
  secondaryLine,
}: {
  mood: CharacterMood;
  bubble: string | null;
  statusLine: string;
  secondaryLine: string;
}) {
  const moodLabel: Record<CharacterMood, string> = {
    idle: "Ready",
    listening: "Listening",
    excited: "Great line",
    thinking: "Thinking",
    coaching: "Hint ready",
  };
  const accent: Record<CharacterMood, string> = {
    idle: "#58A9FF",
    listening: "#7ED957",
    excited: "#FFC947",
    thinking: "#A78BFA",
    coaching: "#58A9FF",
  };
  const spriteMood: Record<CharacterMood, "listening" | "thinking" | "excited" | "coaching"> = {
    idle: "listening",
    listening: "listening",
    excited: "excited",
    thinking: "thinking",
    coaching: "coaching",
  };
  const motionSheet: Record<"listening" | "thinking" | "excited" | "coaching", string> = {
    listening: "url('/assets/cat-coach/cat_listening_motion_alpha.png')",
    thinking: "url('/assets/cat-coach/cat_thinking_motion_alpha.png')",
    excited: "url('/assets/cat-coach/cat_excited_motion_alpha.png')",
    coaching: "url('/assets/cat-coach/cat_coaching_motion_alpha.png')",
  };
  const currentSpriteMood = spriteMood[mood];

  return (
    <div className="practice-coach-strip">
      <div className="practice-cat-stage">
        <div
          className={`cat-motion-coach cat-motion-coach-${currentSpriteMood}`}
          aria-label={`Cat coach is ${moodLabel[mood].toLowerCase()}`}
          style={{
            ["--buddy-accent" as string]: accent[mood],
            ["--cat-motion-sheet" as string]: motionSheet[currentSpriteMood],
          }}
        >
          <span className="cat-motion-glow" />
          <span className="cat-motion-spark cat-motion-spark-one" />
          <span className="cat-motion-spark cat-motion-spark-two" />
          <span className="cat-motion-clip">
            <span className="cat-motion-frame" />
          </span>
        </div>
      </div>
      <div className="practice-bubble-stack">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: accent[mood], boxShadow: `0 0 0 5px ${accent[mood]}22` }}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
            AI Coaching is listening
          </span>
        </div>
        <div
          className="practice-listening-bubble practice-listening-bubble-main"
          style={{ opacity: bubble ? 1 : 0.65 }}
        >
          {bubble || "I am here with you."}
        </div>
        <div className="practice-listening-bubble practice-listening-bubble-soft">
          {statusLine}
        </div>
        <div className="practice-listening-bubble practice-listening-bubble-tiny">
          {secondaryLine}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PracticeRoom() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const topic     = (location.state as { topic?: string } | null)?.topic ?? "";
  const practiceMode = getPracticeMode();
  const coldStartKeywords = topicKeywords(topic);

  // Audio refs
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const scriptProcRef    = useRef<ScriptProcessorNode | null>(null);
  const micSrcRef        = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const phraseChunksRef  = useRef<Float32Array[]>([]);
  const shortBufferRef   = useRef<Float32Array | null>(null);
  const allChunksRef     = useRef<Float32Array[]>([]);
  const speakingRef      = useRef(false);
  const silenceStartRef  = useRef(Date.now());
  const lastVoiceAtRef   = useRef(Date.now());
  const processingRef    = useRef(false);
  const maxExceededRef   = useRef(false);
  const sampleRateRef    = useRef(TARGET_SAMPLE_RATE);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // Transcript scroll
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLSpanElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldRestartRecognitionRef = useRef(false);
  const finalCaptionRef = useRef("");

  // Gemini refs
  const apiReadyRef     = useRef(true);
  const chatSessionRef  = useRef<any>(null);
  const firstSentRef    = useRef(false);

  // Silence → bottleneck timer
  const bottleneckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const miniCoachTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFollowUpAtRef = useRef(0);
  const lastPassiveHighlightAtRef = useRef(0);
  const lastSentencePatternAtRef = useRef(0);
  const lastCaptionAnalysisAtRef = useRef(0);
  const lastFlowBumpAtRef = useRef(0);
  const lastStoryBumpAtRef = useRef(0);
  const prevAnalysisLenRef = useRef(0);
  const durationMilestoneRef = useRef(0);
  const pauseHandledRef = useRef(false);
  const pendingFollowUpRef = useRef("");
  // Pre-generated follow-up from the last processed phrase, ready to pop the
  // instant the user pauses (0 latency). Refilled every chunk by Gemini.
  const bufferedReplyRef = useRef<{ follow_up: string; feedback: string; kind: "question" | "nudge" } | null>(null);

  // State
  const [started, setStarted]               = useState(false);
  const [timer, setTimer]                   = useState(0);
  const [highlightCount, setHighlightCount] = useState(0);
  const [ktvScore, setKtvScore]             = useState<KTVScore>({ flow: 0, words: 0, sentences: 0, story: 0 });
  const [ktvEvents, setKtvEvents]           = useState<KTVEvent[]>([]);
  const [activeKtvMetric, setActiveKtvMetric] = useState<KTVMetric | null>(null);
  const [flashes, setFlashes]               = useState<HighlightFlash[]>([]);
  const [mood, setMood]                     = useState<CharacterMood>("idle");
  const [bubble, setBubble]                 = useState<string | null>("Ready to listen 👂");
  const [transcript, setTranscript]         = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speakingActive, setSpeakingActive] = useState(false);
  const speakingActiveRef = useRef(false);
  const [highlightWords, setHighlightWords] = useState<string[]>([]);
  const [phraseSparks, setPhraseSparks]     = useState<PhraseSpark[]>([]);
  const [showBottleneck, setShowBottleneck] = useState(false);
  const [bottleneckPhase, setBottleneckPhase] = useState<"thinking" | "reply">("thinking");
  const [followUpQ, setFollowUpQ]           = useState("");
  const [followUpKind, setFollowUpKind]     = useState<"question" | "nudge">("question");
  const [followUpFeedback, setFollowUpFeedback] = useState("");
  const [thinkingAck, setThinkingAck]       = useState("");
  const [miniCoachTip, setMiniCoachTip]     = useState("");
  const [apiStatus, setApiStatus]           = useState<"loading" | "ready" | "error">("loading");
  const [aiState, setAiState]               = useState("Warming up AI");
  const [captionStatus, setCaptionStatus]   = useState<"idle" | "listening" | "unsupported" | "error">("idle");
  const [micDenied, setMicDenied]           = useState(false);

  const isStartedRef = useRef(started);
  useEffect(() => { isStartedRef.current = started; }, [started]);

  const transcriptRef = useRef(transcript);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const captionStatusRef = useRef(captionStatus);
  useEffect(() => { captionStatusRef.current = captionStatus; }, [captionStatus]);

  const highlightWordsRef = useRef(highlightWords);
  useEffect(() => { highlightWordsRef.current = highlightWords; }, [highlightWords]);

  const showBottleneckRef = useRef(showBottleneck);
  useEffect(() => { showBottleneckRef.current = showBottleneck; }, [showBottleneck]);

  const bottleneckPhaseRef = useRef(bottleneckPhase);
  useEffect(() => { bottleneckPhaseRef.current = bottleneckPhase; }, [bottleneckPhase]);

  const followUpQRef = useRef(followUpQ);
  useEffect(() => { followUpQRef.current = followUpQ; }, [followUpQ]);

  const recordKtvEvent = useCallback((metric: KTVMetric, delta: number, reason: string) => {
    if (delta <= 0) return;
    const id = Date.now();
    setKtvEvents((prev) => [{ id, metric, delta, reason }, ...prev].slice(0, 4));
    setActiveKtvMetric(metric);
    window.setTimeout(() => {
      setActiveKtvMetric((current) => current === metric ? null : current);
    }, 1400);
  }, []);

  const bumpKtvScore = useCallback((metric: KTVMetric, delta: number, reason: string) => {
    if (delta <= 0) return;
    setKtvScore((prev) => ({
      ...prev,
      [metric]: clampScore(prev[metric] + delta),
    }));
    recordKtvEvent(metric, delta, reason);
  }, [recordKtvEvent]);

  const triggerRewardFlash = useCallback((label: string, points: number, tone: HighlightFlash["tone"] = "highlight") => {
    const id = Date.now();
    setFlashes((prev) => [...prev, { id, points, label, tone }]);
    window.setTimeout(() => setFlashes((prev) => prev.filter((flash) => flash.id !== id)), 1500);
  }, []);

  const triggerPhraseSpark = useCallback((text: string, source: PhraseSpark["source"]) => {
    const id = Date.now();
    setPhraseSparks((prev) => [...prev.slice(-2), { id, text, source }]);
    setTimeout(() => setPhraseSparks((prev) => prev.filter((spark) => spark.id !== id)), 2400);
  }, []);

  const promotePassiveHighlights = useCallback((captionSnapshot: string, source: PhraseSpark["source"] = "caption") => {
    const now = Date.now();
    if (!isStartedRef.current) return;
    if (now - lastPassiveHighlightAtRef.current < PASSIVE_HIGHLIGHT_COOLDOWN_MS && source === "caption") return;

    const candidates = extractBasicHighlightCandidates(captionSnapshot).filter((candidate) => {
      const normalized = candidate.toLowerCase();
      return !highlightWordsRef.current.some((word) => word.toLowerCase() === normalized);
    });
    if (!candidates.length) return;

    const nextWord = candidates[0];
    lastPassiveHighlightAtRef.current = now;
    setHighlightWords((prev) => {
      const nextWords = uniqueCleanWords([...prev, nextWord]);
      highlightWordsRef.current = nextWords;
      return nextWords;
    });
    triggerPhraseSpark(nextWord, source);
    bumpKtvScore("words", source === "ai" ? 3 : 2, `Captured "${nextWord}"`);
    if (!showBottleneckRef.current) {
      setMood("excited");
      setBubble(`Caught "${nextWord}"`);
      window.setTimeout(() => {
        if (!showBottleneckRef.current && isStartedRef.current) {
          setMood("listening");
          setBubble("Listening for your full thought");
        }
      }, 1700);
    }
    setAiState(source === "ai" ? "AI found a phrase highlight" : "Phrase highlight captured");
  }, [bumpKtvScore, triggerPhraseSpark]);

  // Phase 2: fill the open bottleneck card with the real reply. Bails if the
  // student already resumed speaking or the card was dismissed.
  const enterReply = useCallback((question: string, feedback: string, kind: "question" | "nudge") => {
    if (!question.trim() || !showBottleneckRef.current || speakingRef.current) return;
    setFollowUpQ(question.trim());
    setFollowUpKind(kind);
    setFollowUpFeedback(feedback.trim());
    setBottleneckPhase("reply");
    setMood("coaching");
    setBubble(feedback.trim() || "Here's a thought.");
    setAiState("Coach has a suggestion");
  }, []);

  const collapseFollowUpToTag = useCallback(() => {
    const tip = followUpQRef.current.trim();
    if (!tip) return;
    if (miniCoachTipTimerRef.current) clearTimeout(miniCoachTipTimerRef.current);
    setMiniCoachTip(tip);
    miniCoachTipTimerRef.current = window.setTimeout(() => {
      setMiniCoachTip("");
      miniCoachTipTimerRef.current = null;
    }, 9000);
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [started]);

  // Session duration score
  useEffect(() => {
    if (!started) return;
    const milestone = Math.floor(timer / 30);
    if (milestone > 0 && milestone > durationMilestoneRef.current) {
      durationMilestoneRef.current = milestone;
      const seconds = milestone * 30;
      bumpKtvScore("flow", seconds % 60 === 0 ? 6 : 3, `Stayed with it for ${seconds}s`);
      if (seconds % 60 === 0) {
        triggerRewardFlash(`${seconds / 60} min streak`, 10, "milestone");
        setMood("excited");
        setBubble(`You kept going for ${seconds / 60} minute${seconds >= 120 ? "s" : ""}.`);
        window.setTimeout(() => {
          if (isStartedRef.current && !showBottleneckRef.current) {
            setMood("listening");
            setBubble("Listening for your full thought");
          }
        }, 2200);
      }
    }
  }, [bumpKtvScore, started, timer, triggerRewardFlash]);

  // Auto-scroll only the transcript reel, so live captions never move the page.
  useEffect(() => {
    const reel = transcriptScrollRef.current;
    if (!reel) return;
    reel.scrollTo({ top: reel.scrollHeight, behavior: "smooth" });
  }, [transcript, interimTranscript]);

  const stopLiveCaptions = useCallback((clearText = false) => {
    shouldRestartRecognitionRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch {
        try { recognition.abort(); } catch { /* noop */ }
      }
      recognitionRef.current = null;
    }
    setCaptionStatus("idle");
    setInterimTranscript("");
    if (clearText) {
      finalCaptionRef.current = "";
      transcriptRef.current = "";
      setTranscript("");
    }
  }, []);

  const startLiveCaptions = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as WindowWithSpeechRecognition).SpeechRecognition ||
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setCaptionStatus("unsupported");
      setAiState("Live captions need Chrome or Edge");
      return;
    }

    stopLiveCaptions(false);
    finalCaptionRef.current = "";
    setInterimTranscript("");
    shouldRestartRecognitionRef.current = true;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const phrase = result?.[0]?.transcript?.trim();
        if (!phrase) continue;
        if (result.isFinal) finalParts.push(phrase);
        else interimParts.push(phrase);
      }

      if (finalParts.length > 0) {
        finalCaptionRef.current = [finalCaptionRef.current, ...finalParts]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        transcriptRef.current = finalCaptionRef.current;
        setTranscript(finalCaptionRef.current);
      }

      // Fast path: captions update on every event, no heavy work here.
      const interimText = interimParts.join(" ").replace(/\s+/g, " ").trim();
      setInterimTranscript(interimText);
      setCaptionStatus("listening");
      if (apiStatus === "ready") setAiState("Live captions on");

      // Slow path: throttle analysis (>=700ms or on a final) and only scan the
      // recent tail, so fast continuous speech doesn't choke the main thread.
      const now = Date.now();
      if (!(finalParts.length > 0) && now - lastCaptionAnalysisAtRef.current < 700) return;
      lastCaptionAnalysisAtRef.current = now;

      const fullCaption = [finalCaptionRef.current, interimText].filter(Boolean).join(" ");
      const tail = fullCaption.slice(-200);
      if (tail.length > 18) promotePassiveHighlights(tail);
      const sentencePattern = detectSentencePattern(tail);
      if (sentencePattern && now - lastSentencePatternAtRef.current > 4500) {
        lastSentencePatternAtRef.current = now;
        bumpKtvScore("sentences", sentencePattern.delta, `Used a ${sentencePattern.label}`);
      }

      // Flow: reward sustained talking (transcript kept growing).
      if (fullCaption.length > prevAnalysisLenRef.current + 12 && now - lastFlowBumpAtRef.current > 3000) {
        lastFlowBumpAtRef.current = now;
        bumpKtvScore("flow", 2, "Kept your idea going");
      }
      prevAnalysisLenRef.current = fullCaption.length;

      // Story: reward connecting ideas (cause / example / consequence).
      if (now - lastStoryBumpAtRef.current > 5000 && /\b(because|so that|for example|for instance|this shows|this means|as a result|therefore|which means)\b/i.test(tail)) {
        lastStoryBumpAtRef.current = now;
        bumpKtvScore("story", 3, "Connected an idea");
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.warn("Speech recognition error:", event.error);
      setCaptionStatus("error");
      setInterimTranscript("");
      setAiState("Live captions paused");
    };

    recognition.onend = () => {
      if (!shouldRestartRecognitionRef.current || !isStartedRef.current) return;
      window.setTimeout(() => {
        if (!shouldRestartRecognitionRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.start();
          setCaptionStatus("listening");
        } catch {
          setCaptionStatus("error");
        }
      }, 250);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setCaptionStatus("listening");
      setAiState("Live captions on");
    } catch (error) {
      console.warn("Speech recognition start failed:", error);
      setCaptionStatus("error");
      setAiState("Live captions paused");
    }
  }, [apiStatus, bumpKtvScore, promotePassiveHighlights, stopLiveCaptions]);

  // ── Proxy-ready status ────────────────────────────────────────────────────
  useEffect(() => {
    setApiStatus("ready");
    setAiState("Coach ready");
  }, []);

  // ── Send audio chunk to Gemini ─────────────────────────────────────────────
  const sendToGemini = useCallback(async (wavBlob: Blob): Promise<GeminiResult | null> => {
    try {
      setAiState("Following your last phrase");
      const audioB64 = await blobToBase64(wavBlob);
      const parts = firstSentRef.current
        ? [{ inlineData: { mimeType: "audio/wav", data: audioB64 } }]
        : [{ text: SYSTEM_PROMPT }, { inlineData: { mimeType: "audio/wav", data: audioB64 } }];
      firstSentRef.current = true;

      const { text } = await callGeminiProxy({
        model: MODEL_NAME,
        responseMimeType: "application/json",
        temperature: 0.7,
        contents: [{ role: "user", parts }],
      });
      const parsed = parseGeminiJson(text.trim());
      setAiState(parsed ? "AI reflected on your words" : "AI response needs retry");
      return parsed;
    } catch (e) {
      console.error("Gemini error:", e);
      setAiState("AI had trouble hearing that");
      return null;
    }
  }, []);

  // Ask Gemini for a real, content-aware pause reply. Returns parsed result
  // (question or nudge) or null; does NOT touch the UI directly.
  const fetchFollowUpReply = useCallback(async (): Promise<{ follow_up: string; feedback: string; kind: "question" | "nudge" } | null> => {
    if (!isStartedRef.current) return null;
    const context = transcriptRef.current
      ? `Transcript so far: "${transcriptRef.current.slice(-900)}"`
      : "The student has not produced a clear transcript yet.";
    const { text } = await callGeminiProxy({
      model: MODEL_NAME,
      responseMimeType: "application/json",
      temperature: 0.7,
      contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }, { text: `${FOLLOW_UP_PROMPT}\n\n${context}` }] }],
    });
    const parsed = parseGeminiJson(text);
    if (!parsed?.follow_up?.trim()) return null;
    return {
      follow_up: parsed.follow_up.trim(),
      feedback: parsed.feedback?.trim() || "",
      kind: parsed.kind === "nudge" ? "nudge" : "question",
    };
  }, []);

  // Multi-layer reply: Layer 1 = fast content-aware LOCAL reply (~700ms) for
  // a real-time feel; Layer 2 = Gemini upgrade within a short budget (2.5s).
  // Deep coaching is deferred to the Takeaway page, not blocked on here.
  const resolvePauseReply = useCallback(async () => {
    const showLocal = () => {
      if (!showBottleneckRef.current || speakingRef.current) return;
      const local = localPauseReply(transcriptRef.current, highlightWordsRef.current);
      enterReply(local.follow_up, local.feedback, local.kind);
    };
    const fastTimer = window.setTimeout(showLocal, 700);
    let gemini: { follow_up: string; feedback: string; kind: "question" | "nudge" } | null = null;
    try {
      gemini = await Promise.race([
        fetchFollowUpReply(),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
      ]);
    } catch (e) {
      console.error("Gemini follow-up error:", e);
    }
    window.clearTimeout(fastTimer);
    if (!showBottleneckRef.current || speakingRef.current) return;
    if (gemini) enterReply(gemini.follow_up, gemini.feedback, gemini.kind);
    else showLocal();
  }, [enterReply, fetchFollowUpReply]);

  // On a >=3s pause, INSTANTLY pop the pre-buffered Gemini follow-up (prepared
  // while the student was speaking) — no thinking wait. If the buffer is empty
  // (e.g. very first pause), use a content-aware local reply.
  const beginPauseCoaching = useCallback(() => {
    if (showBottleneckRef.current) return;
    const silenceMs = Date.now() - lastVoiceAtRef.current;
    if (speakingRef.current || silenceMs < BOTTLENECK_SILENCE_MS) return;
    lastFollowUpAtRef.current = Date.now();
    pauseHandledRef.current = true;
    if (miniCoachTipTimerRef.current) clearTimeout(miniCoachTipTimerRef.current);
    setMiniCoachTip("");
    const ready = bufferedReplyRef.current ?? localPauseReply(transcriptRef.current, highlightWordsRef.current);
    bufferedReplyRef.current = null; // consumed; next pause waits for a fresh one
    showBottleneckRef.current = true;
    setShowBottleneck(true);
    enterReply(ready.follow_up, ready.feedback, ready.kind);
  }, [enterReply]);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      if (!isStartedRef.current || showBottleneckRef.current || pauseHandledRef.current) return;
      const silenceMs = Date.now() - lastVoiceAtRef.current;
      const hasContext = transcriptRef.current.length > 12 || highlightWordsRef.current.length > 0 || allChunksRef.current.length > 0;
      if (hasContext && silenceMs >= BOTTLENECK_SILENCE_MS) {
        speakingRef.current = false;
        beginPauseCoaching();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [beginPauseCoaching, started]);

  // ── Process audio phrase ───────────────────────────────────────────────────
  const processPhrase = useCallback(async (isFinal = false) => {
    if (processingRef.current && !isFinal) return;
    processingRef.current = true;
    try {
      const chunks = shortBufferRef.current
        ? [shortBufferRef.current, ...phraseChunksRef.current]
        : [...phraseChunksRef.current];
      shortBufferRef.current = null;
      phraseChunksRef.current = [];
      speakingRef.current = false;
      if (!chunks.length) return;

      const combined  = concatenate(chunks);
      const durationS = combined.length / sampleRateRef.current;
      if (!isFinal && durationS < MIN_PHRASE_SECONDS) {
        shortBufferRef.current = combined;
        setAiState("Holding a short phrase");
        return;
      }

      // Show the coach "thinking" while we wait on Gemini (auto state switch).
      setMood("thinking");
      const wav    = createWavBlob(combined, sampleRateRef.current);
      const result = await sendToGemini(wav);
      if (!result) return;

      // Gemini transcript is only a fallback. Live captions own the real-time UI.
      if (result.transcript && captionStatusRef.current !== "listening") {
        const nextTranscript = transcriptRef.current + (transcriptRef.current ? " " : "") + result.transcript.trim();
        transcriptRef.current = nextTranscript;
        finalCaptionRef.current = nextTranscript;
        setTranscript(nextTranscript);
      }

      const delta = result.score_delta || {};

      // Vocabulary highlights
      if (result.highlight_words?.length) {
        const cleanWords = uniqueCleanWords(result.highlight_words);
        setHighlightWords((prev) => {
          const nextWords = uniqueCleanWords([...prev, ...cleanWords]);
          highlightWordsRef.current = nextWords;
          return nextWords;
        });
        if (cleanWords[0]) triggerPhraseSpark(cleanWords[0], "ai");
        const wordsDelta = delta.words ?? cleanWords.length * 4;
        if (cleanWords[0]) bumpKtvScore("words", wordsDelta, `Stronger phrase: "${cleanWords[0]}"`);
      } else if (result.transcript) {
        promotePassiveHighlights(result.transcript, "ai");
      }

      const sentencePattern = result.transcript ? detectSentencePattern(result.transcript) : undefined;
      if (sentencePattern) {
        bumpKtvScore("sentences", delta.sentences ?? sentencePattern.delta, `Used a ${sentencePattern.label}`);
      }

      const flowDelta = delta.flow ?? (durationS > 2 ? 3 : 1);
      const storyDelta = delta.story ?? (result.highlight_moment ? 4 : 2);
      bumpKtvScore(
        "flow",
        flowDelta,
        durationS > 2 ? "Kept the idea moving" : "Started a clear phrase"
      );
      bumpKtvScore(
        "story",
        storyDelta,
        result.highlight_moment ? "Strong claim or evidence" : "Idea chunk completed"
      );

      // Character mood + bubble
      const newMood: CharacterMood =
        result.mood === "excited" ? "excited"
        : result.mood === "thinking" ? "thinking"
        : "listening";
      setMood(newMood);
      const safeFeedback = result.feedback?.trim() && !result.feedback.includes("?")
        ? result.feedback.trim()
        : "I am following your idea.";
      setBubble(safeFeedback);

      if (result.highlight_moment || (result.highlight_words?.length || 0) >= 2) {
        const pts = 12 + Math.min(18, Math.round(durationS * 2) + (result.highlight_words?.length || 0) * 3);
        setHighlightCount((n) => n + 1);
        triggerRewardFlash("strong moment", pts);
      }

      // Pre-buffer the next follow-up from this chunk's Gemini reply, ready to
      // pop instantly on a pause. Keep the last good one if this chunk had none.
      pendingFollowUpRef.current = result.follow_up?.trim() || "";
      if (result.follow_up?.trim()) {
        bufferedReplyRef.current = {
          follow_up: result.follow_up.trim(),
          feedback: result.feedback?.trim() || "",
          kind: result.kind === "nudge" ? "nudge" : "question",
        };
      }

      // Reset to listening after 3s
      setTimeout(() => {
        setMood("listening");
        setBubble("Listening for your full thought");
      }, 3000);

    } finally {
      processingRef.current = false;
    }
  }, [bumpKtvScore, promotePassiveHighlights, sendToGemini, triggerPhraseSpark, triggerRewardFlash]);

  // ── VAD / ScriptProcessor ─────────────────────────────────────────────────
  const startVAD = useCallback(() => {
    if (!scriptProcRef.current || !micSrcRef.current || !analyserRef.current || !audioCtxRef.current) return;

    scriptProcRef.current.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!isStartedRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const now   = Date.now();

      // RMS energy
      let sum = 0; for (const s of input) sum += s * s;
      const rms = Math.sqrt(sum / input.length);

      const phraseLen = phraseChunksRef.current.reduce((s, c) => s + c.length, 0);
      const phraseSec = phraseLen / sampleRateRef.current;
      if (phraseSec > MAX_PHRASE_SECONDS) maxExceededRef.current = true;

      if (rms > ENERGY_THRESHOLD) {
        speakingRef.current = true;
        if (!speakingActiveRef.current) { speakingActiveRef.current = true; setSpeakingActive(true); }
        phraseChunksRef.current.push(new Float32Array(input));
        allChunksRef.current.push(new Float32Array(input));
        silenceStartRef.current = now;
        lastVoiceAtRef.current = now;
        pauseHandledRef.current = false;
        // Cancel bottleneck timer on resumed speech
        if (bottleneckTimerRef.current) { clearTimeout(bottleneckTimerRef.current); bottleneckTimerRef.current = null; }
        // Only auto-dismiss while still "thinking" (no real reply yet). Once a
        // reply is shown, keep it pinned until the user taps Use it / Skip.
        if (showBottleneckRef.current && bottleneckPhaseRef.current === "thinking") {
          showBottleneckRef.current = false;
          setShowBottleneck(false);
        }
        if (maxExceededRef.current) {
          maxExceededRef.current = false;
          if (!processingRef.current) {
            processPhrase(false);
          } else {
            setAiState("AI analyzing; next phrase queued");
          }
        }
      } else {
        const silenceMs = now - lastVoiceAtRef.current;
        if (speakingActiveRef.current && silenceMs > 1200) { speakingActiveRef.current = false; setSpeakingActive(false); }
        if (speakingRef.current && (silenceMs > SILENCE_DURATION_MSEC || maxExceededRef.current)) {
          maxExceededRef.current = false;
          speakingRef.current = false;
          if (!processingRef.current) {
            processPhrase(false);
          } else {
            setAiState("AI analyzing; next phrase queued");
          }
        } else if (speakingRef.current) {
          phraseChunksRef.current.push(new Float32Array(input));
          allChunksRef.current.push(new Float32Array(input));
        }

        // Bottleneck timer (4.8s total silence → ask follow-up)
        const canAskFollowUp = Date.now() - lastFollowUpAtRef.current > BOTTLENECK_SILENCE_MS + 2500;
        if (allChunksRef.current.length > 0 && silenceMs > BOTTLENECK_SILENCE_MS && canAskFollowUp && !bottleneckTimerRef.current && !showBottleneckRef.current) {
          bottleneckTimerRef.current = setTimeout(() => {
            if (!processingRef.current && phraseChunksRef.current.length > 0) processPhrase(false);
            else if (!processingRef.current) beginPauseCoaching();
            else setAiState("AI analyzing; pause helper waiting");
            bottleneckTimerRef.current = null;
          }, 0);
        }
      }
    };

    micSrcRef.current.connect(analyserRef.current);
    analyserRef.current.connect(scriptProcRef.current);
    scriptProcRef.current.connect(audioCtxRef.current.destination);
  }, [collapseFollowUpToTag, processPhrase, beginPauseCoaching]);

  // ── Canvas waveform (bigger) ───────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const analyser = analyserRef.current;
    const bufLen   = analyser ? analyser.frequencyBinCount : 64;
    const data     = new Uint8Array(bufLen);

    rafRef.current = requestAnimationFrame(drawWaveform);
    ctx.clearRect(0, 0, W, H);
    if (analyser) analyser.getByteFrequencyData(data);

    const BAR_COUNT = 48, gap = 3;
    const barW = (W - gap * (BAR_COUNT - 1)) / BAR_COUNT;

    for (let i = 0; i < BAR_COUNT; i++) {
      const raw    = analyser ? data[Math.floor((i / BAR_COUNT) * bufLen)] / 255 : 0;
      const breath = Math.sin(Date.now() / 700 + i * 0.45) * 0.12 + 0.14;
      const pct    = analyser ? Math.max(breath, raw * 0.85) : breath;
      const barH   = Math.max(4, H * pct * 0.9);
      const x      = i * (barW + gap);
      const y      = (H - barH) / 2;
      const r      = Math.min(barW / 2, 6);
      const hue    = pct < 0.3 ? 210 : pct < 0.6 ? 155 : 25;
      ctx.fillStyle = `hsla(${hue},75%,52%,${0.65 + pct * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + barW, y, x + barW, y + barH, r);
      ctx.arcTo(x + barW, y + barH, x, y + barH, r);
      ctx.arcTo(x, y + barH, x, y, r);
      ctx.arcTo(x, y, x + barW, y, r);
      ctx.closePath();
      ctx.fill();
    }
  }, []);

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setStarted(true);
    isStartedRef.current = true;
    setMood("listening");
    setBubble("I'm listening! 🎙️");
    chatSessionRef.current   = null;
    firstSentRef.current     = false;
    phraseChunksRef.current  = [];
    shortBufferRef.current   = null;
    allChunksRef.current     = [];
    silenceStartRef.current  = Date.now();
    lastVoiceAtRef.current   = Date.now();
    lastFollowUpAtRef.current = 0;
    lastPassiveHighlightAtRef.current = 0;
    lastSentencePatternAtRef.current = 0;
    lastCaptionAnalysisAtRef.current = 0;
    lastFlowBumpAtRef.current = 0;
    lastStoryBumpAtRef.current = 0;
    prevAnalysisLenRef.current = 0;
    speakingActiveRef.current = false;
    setSpeakingActive(false);
    durationMilestoneRef.current = 0;
    pauseHandledRef.current = false;
    pendingFollowUpRef.current = "";
    if (miniCoachTipTimerRef.current) clearTimeout(miniCoachTipTimerRef.current);
    finalCaptionRef.current = "";
    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setHighlightWords([]);
    setPhraseSparks([]);
    setFollowUpQ("");
    setMiniCoachTip("");
    showBottleneckRef.current = false;
    setShowBottleneck(false);
    setKtvScore({ flow: 0, words: 0, sentences: 0, story: 0 });
    setKtvEvents([]);
    setActiveKtvMetric(null);
    setHighlightCount(0);
    setAiState("Listening for your first full idea");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      sampleRateRef.current = ctx.sampleRate;
      audioCtxRef.current  = ctx;
      micSrcRef.current    = ctx.createMediaStreamSource(stream);
      analyserRef.current  = ctx.createAnalyser(); analyserRef.current.fftSize = 256;
      scriptProcRef.current = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      startVAD();
      startLiveCaptions();
    } catch {
      setMicDenied(true);
      setBubble("No mic - demo mode");
      setAiState("Microphone unavailable");
    }
    drawWaveform();
  }, [drawWaveform, startLiveCaptions, startVAD]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopLiveCaptions();
      scriptProcRef.current?.disconnect();
      audioCtxRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (bottleneckTimerRef.current) clearTimeout(bottleneckTimerRef.current);
      if (miniCoachTipTimerRef.current) clearTimeout(miniCoachTipTimerRef.current);
    };
  }, [stopLiveCaptions]);

  // ── Trigger manual highlight ───────────────────────────────────────────────
  const triggerHighlight = () => {
    const pts = 15 + Math.floor(Math.random() * 16);
    setHighlightCount((n) => n + 1);
    triggerRewardFlash("saved moment", pts);
    setMood("excited");
    setBubble(`Amazing! +${pts} ⭐`);
    bumpKtvScore("story", 5, "Saved a reusable idea");
    setTimeout(() => {
      setMood("listening");
      setBubble("Keep that energy! 💪");
    }, 1800);
  };

  // ── End session ────────────────────────────────────────────────────────────
  const endSession = async () => {
    if (!started) { navigate("/"); return; }
    try {
      if (phraseChunksRef.current.length > 0 || shortBufferRef.current) await processPhrase(true);
    } catch { /* best-effort flush */ }
    isStartedRef.current = false;
    stopLiveCaptions();
    cancelAnimationFrame(rafRef.current);
    try { scriptProcRef.current?.disconnect(); } catch { /* noop */ }
    try { audioCtxRef.current?.close(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const sessionSummary = {
      timer,
      highlightCount,
      ktvScore,
      ktvEvents,
      highlightWords: highlightWordsRef.current,
      transcript: transcriptRef.current,
    };
    window.sessionStorage.setItem("meaningfully.lastSession", JSON.stringify(sessionSummary));
    navigate("/session-end", { state: sessionSummary });
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const scoreColor = (v: number) =>
    v < 40 ? "#FF7A5C" : v < 70 ? "#FFC947" : v < 90 ? "#7ED957" : "#58A9FF";

  const latestKtvEvent = ktvEvents[0];
  const coachStatusLine = started
    ? speakingActive
      ? "Is listening to your story..."
      : showBottleneck
      ? "Holding this pause with you"
      : "Waiting for the next sentence"
    : "Ready to follow your idea";
  const coachSecondaryLine = started
    ? showBottleneck
      ? "I will ask only when the pause becomes useful."
      : miniCoachTip
      ? "One small prompt is parked below."
      : "Keep going. I will not interrupt the flow."
    : "Tap start and speak naturally.";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 select-none relative overflow-hidden">

      {/* Highlight flash */}
      {flashes.map((f) => (
        <div key={f.id} className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div className="absolute inset-0" style={{
            background: f.tone === "milestone"
              ? "radial-gradient(ellipse at center,rgba(126,217,87,0.34) 0%,transparent 64%)"
              : "radial-gradient(ellipse at center,rgba(255,201,71,0.4) 0%,transparent 62%)",
            animation: "highlight-pop 1.2s ease-out forwards",
          }} />
          {/* expanding burst ring */}
          <span className="absolute h-32 w-32 rounded-full animate-ping"
            style={{ border: `4px solid ${f.tone === "milestone" ? "rgba(126,217,87,0.55)" : "rgba(245,158,11,0.6)"}` }} />
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-5xl font-black"
              style={{
                color: f.tone === "milestone" ? "#16A34A" : "#F59E0B",
                textShadow: f.tone === "milestone" ? "0 0 18px rgba(126,217,87,0.6)" : "0 0 18px rgba(245,158,11,0.65)",
                animation: "score-jump 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
              }}
            >
              +{f.points} ⭐
            </span>
            {f.label && (
              <span className="rounded-full bg-white px-3.5 py-1.5 text-sm font-black uppercase tracking-widest text-gray-600 shadow-lg">
                {f.label}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* ── Top bar ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-amber-400" />
            <span className="text-sm font-bold text-gray-800">{highlightCount}</span>
            <span className="text-xs text-gray-400">AI moments</span>
            {apiStatus === "loading" && <span className="text-xs text-blue-400 ml-2">· AI loading…</span>}
            {apiStatus === "error"   && <span className="text-xs text-red-400 ml-2">· AI offline</span>}
            {micDenied              && <span className="text-xs text-gray-400 ml-2">· demo</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-gray-400" />
            <span className="font-mono text-sm font-bold text-gray-700">{fmt(timer)}</span>
          </div>
          <button onClick={endSession}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform border"
            style={{ background: "rgba(255,122,92,0.1)", borderColor: "rgba(255,122,92,0.4)", color: "#EF4444" }}>
            <StopCircle size={13} />End
          </button>
        </div>


        {/* KTV bars — purposeful event score */}
        <div className="bg-white rounded-xl px-3 py-2.5 shadow-sm border border-gray-100 space-y-2">
          <div className="grid grid-cols-2 gap-x-2 gap-y-2">
            {KTV_ITEMS.map(({ label, key, icon, purpose }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 min-w-0 rounded-lg px-1.5 py-1 transition-all duration-300"
                style={{
                  background: activeKtvMetric === key ? "rgba(255,201,71,0.16)" : "transparent",
                  boxShadow: activeKtvMetric === key ? "0 0 0 1px rgba(255,201,71,0.28)" : "none",
                }}
              >
                <span className="text-xs">{icon}</span>
                <div className="w-[56px] min-w-0 leading-none">
                  <div className="truncate text-[11px] font-black text-gray-600">{label}</div>
                  <div className="truncate text-[9px] font-semibold text-gray-300 mt-0.5">{purpose}</div>
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${ktvScore[key]}%`, background: scoreColor(ktvScore[key]) }} />
                </div>
                <span className="text-xs font-mono text-gray-400 w-6 text-right">{Math.round(ktvScore[key])}</span>
              </div>
            ))}
          </div>
          <div className="min-h-[18px]">
            {latestKtvEvent ? (
              <div className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold"
                style={{ background: "rgba(88,169,255,0.08)", color: "#2563EB", animation: "score-jump 0.45s ease-out" }}>
                <span>{KTV_META[latestKtvEvent.metric].icon}</span>
                <span>+{latestKtvEvent.delta} {KTV_META[latestKtvEvent.metric].short}</span>
                <span className="truncate text-gray-500 font-semibold">· {latestKtvEvent.reason}</span>
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-gray-300 px-2">Scores move when you keep speaking, add phrases, and complete ideas.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-28 sm:px-4">
        {/* ── AI listening panel: coach, prompt, and transcript stay in stable layers ── */}
        <section className="practice-room-panel relative flex min-h-[520px] flex-col overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white/78 p-4 shadow-sm">
          <div className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "linear-gradient(180deg,rgba(88,169,255,0.08),transparent 38%,rgba(126,217,87,0.08))" }} />

          {phraseSparks.map((spark, index) => (
            <div
              key={spark.id}
              className="pointer-events-none absolute right-4 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black shadow-md"
              style={{
                top: 18 + index * 34,
                color: spark.source === "ai" ? "#92400E" : "#2563EB",
                borderColor: spark.source === "ai" ? "rgba(251,191,36,0.65)" : "rgba(88,169,255,0.45)",
                background: spark.source === "ai" ? "rgba(255,248,220,0.96)" : "rgba(239,246,255,0.96)",
                animation: "phrase-spark 2.4s ease-out forwards",
              }}
            >
              <Sparkles size={12} />
              {spark.text}
            </div>
          ))}

          <div className="relative z-[1] mb-3 flex items-center justify-between">
            <div>
              <p className="mb-0.5 text-[11px] font-semibold text-gray-500">{practiceMode.emoji} {practiceMode.label}</p>
              {topic ? (
                <p className="mb-0.5 text-[11px] font-semibold text-gray-400">Topic · {topic}</p>
              ) : null}
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-500">Coach is following your story</p>
              <p className="text-xs font-semibold text-gray-400">
                {started ? (micDenied ? "Demo mode" : "I'm with your idea — keep going") : "Ready when you are"}
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-black"
              style={{
                background: started ? "rgba(126,217,87,0.16)" : "rgba(88,169,255,0.12)",
                color: started ? "#16A34A" : "#2563EB",
              }}
            >
              {started ? "Live" : apiStatus === "loading" ? "Loading" : "Ready"}
            </span>
          </div>

          {coldStartKeywords.length > 0 && (
            <div className="relative z-[1] -mt-1 mb-2 flex flex-wrap gap-1.5">
              {coldStartKeywords.map((kw) => {
                const used = transcript.toLowerCase().includes(kw.toLowerCase());
                return (
                  <span
                    key={kw}
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors"
                    style={used
                      ? { background: "rgba(126,217,87,0.18)", color: "#16A34A" }
                      : { background: "rgba(148,163,184,0.14)", color: "#64748B" }}
                  >
                    {used ? "✓ " : "💡 "}{kw}
                  </span>
                );
              })}
            </div>
          )}

          <div className="relative z-[1] flex justify-center py-1">
            <AICharacter
              mood={started ? mood : "idle"}
              bubble={started ? bubble : apiStatus === "loading" ? "Warming up AI..." : "Tap start and I will follow your idea."}
              statusLine={coachStatusLine}
              secondaryLine={coachSecondaryLine}
            />
          </div>

          {started ? (
            <>
              <div
                className="practice-prompt-card relative z-[1] mt-3"
                style={{ animation: showBottleneck ? "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) forwards" : "float-in 0.25s ease-out forwards" }}
              >
                {showBottleneck && bottleneckPhase === "thinking" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-700">{thinkingAck || "let me think..."}</span>
                    <span className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                ) : showBottleneck ? (
                  <>
                    <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-blue-500">
                      {followUpKind === "nudge" ? "Try this next" : "Coach asks"}
                    </p>
                    {followUpFeedback && (
                      <p className="mb-1.5 text-xs font-semibold italic text-gray-400">{followUpFeedback}</p>
                    )}
                    <p className="text-[15px] font-black leading-snug text-gray-900">{followUpQ}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => { collapseFollowUpToTag(); showBottleneckRef.current = false; setShowBottleneck(false); setBottleneckPhase("thinking"); setMood("listening"); setBubble("That's it. Keep building it."); }}
                        className="flex-1 rounded-xl py-2 text-sm font-black text-white active:scale-95"
                        style={{ background: "linear-gradient(135deg,#58A9FF,#7ED957)" }}
                      >
                        Use it
                      </button>
                      <button
                        onClick={() => { setMiniCoachTip(""); showBottleneckRef.current = false; setShowBottleneck(false); setBottleneckPhase("thinking"); setMood("listening"); setBubble("No worries. I am still listening."); }}
                        className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500 active:scale-95"
                      >
                        Skip
                      </button>
                    </div>
                  </>
                ) : miniCoachTip ? (
                  <div className="flex items-start gap-2">
                    <MessageCircle size={14} className="mt-0.5 shrink-0 text-blue-500" />
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-blue-700">{miniCoachTip}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="shrink-0 text-blue-500" />
                    <p className="text-xs font-bold leading-snug text-gray-500">
                      Keep speaking. I will wait for a real pause before asking.
                    </p>
                  </div>
                )}
              </div>

              <div className="practice-transcript-shell relative z-[1] mx-auto mt-3 w-full max-w-[318px]">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <MessageCircle size={11} />Transcript reel
                  <span className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: speakingActive ? "#7ED957" : captionStatus === "listening" ? "#58A9FF" : "#D1D5DB" }} />
                </div>
                <div ref={transcriptScrollRef} className="practice-transcript-reel">
                  {(() => {
                    if (!transcript && !interimTranscript) {
                      return (
                        <p className="text-[15px] italic text-gray-300">
                          {captionStatus === "unsupported"
                            ? "Live captions need Chrome or Edge..."
                            : captionStatus === "error"
                            ? "Live captions paused..."
                            : "Your words will appear here..."}
                        </p>
                      );
                    }
                    // Teleprompter: previous lines above (dimmed), current line
                    // locked in the middle (bold/highlighted), interim below.
                    const lines = recentLines(transcript, 3);
                    const current = lines[lines.length - 1] || "";
                    const prev = lines.slice(0, -1);
                    return (
                      <>
                        {prev.map((ln, i) => (
                          <p key={`prev-${i}`} className="truncate text-[14px] font-semibold leading-relaxed text-gray-300">{ln}</p>
                        ))}
                        {current && (
                          <p className="text-[18px] font-black leading-relaxed text-gray-900">
                            {applyHighlights(current, highlightWords).map((p, i) =>
                              p.hl ? (
                                <mark key={i} className="phrase-highlight rounded px-0.5"
                                  style={{ background: "rgba(88,169,255,0.2)", color: "#2563EB" }}>{p.str}</mark>
                              ) : <span key={i}>{p.str}</span>
                            )}
                          </p>
                        )}
                        {interimTranscript && (
                          <p className="truncate text-[14px] font-bold leading-relaxed text-blue-500">{interimTranscript}</p>
                        )}
                        <span ref={transcriptEndRef} />
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-[1] mt-auto flex flex-col items-center gap-3 pt-8">
              <button onClick={startSession}
                disabled={apiStatus === "loading"}
                className="rounded-2xl px-8 py-4 text-base font-black text-white shadow-md transition-transform active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#58A9FF,#7ED957)", boxShadow: "0 6px 20px rgba(88,169,255,0.3)" }}>
                {apiStatus === "loading" ? "Loading AI..." : "🎙️ Start Speaking"}
              </button>
            </div>
          )}

          {started && highlightWords.length > 0 && (
            <div className="relative z-[1] mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {highlightWords.slice(-5).map((w) => (
                <span key={w} className="flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold"
                  style={{ background: "rgba(88,169,255,0.13)", color: "#2563EB" }}>
                  <Sparkles size={10} className="mr-1 inline" />{w}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── Bottom waveform — kept as a calm breathing indicator, not a focal point ── */}
        <section className="px-2">
          <canvas
            ref={canvasRef}
            width={420}
            height={126}
            style={{ width: "100%", height: 34, opacity: started && !micDenied ? 0.45 : 0.25 }}
          />
        </section>

        {started && (
          <button onClick={triggerHighlight}
            className="w-full rounded-2xl border py-3.5 text-sm font-bold transition-transform active:scale-95"
            style={{ background: "rgba(255,201,71,0.1)", borderColor: "rgba(255,201,71,0.5)", color: "#D97706" }}>
            <Zap size={16} className="mr-2 inline" />Save this moment
          </button>
        )}
      </div>
      <AppTabBar />
    </div>
  );
}
