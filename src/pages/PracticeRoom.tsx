import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, MessageCircle, Sparkles, Star, StopCircle, Zap } from "lucide-react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_NAME             = "gemini-2.5-flash";
const ENERGY_THRESHOLD       = 0.003;
const SILENCE_DURATION_MSEC  = 900;
const TARGET_SAMPLE_RATE     = 16000;
const BUFFER_SIZE            = 1024;
const MIN_PHRASE_SECONDS     = 1.2;
const MAX_PHRASE_SECONDS     = 5.5;
const BOTTLENECK_SILENCE_MS  = 4000;

// ─── Gemini prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a real-time AI speaking partner helping a middle school student practice an English science presentation.

Listen to the audio carefully. Judge ONLY from what the student actually said in this chunk and the prior chat context.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "transcript": "exact transcription of what was said",
  "feedback": "1 specific, natural reaction under 10 words",
  "highlight_words": ["advanced", "less common", "academic", "scientific", "or vivid words the student actually used"],
  "follow_up": "if the student pauses, trails off, repeats fillers, or seems stuck: ask 1 helpful question. Otherwise empty string.",
  "mood": "excited",
  "highlight_moment": false,
  "score_delta": { "fluency": 0, "vocabulary": 0, "flow": 0 }
}

Rules:
- transcript: accurate transcription only, no extra commentary
- feedback must mention a real word, idea, evidence, transition, or behavior from the audio. Avoid generic phrases like "good point" or "nice job".
- highlight_words: include only words or short phrases present in transcript. Prefer words the student may not commonly use.
- follow_up: make it inspiring and content-aware. Help the student continue the idea, add evidence, explain impact, or compare examples.
- mood: "excited" if strong phrases used | "thinking" if short/stuck | "listening" otherwise
- highlight_moment: true only when the student says a strong claim, vivid explanation, evidence, or unusually good vocabulary.
- score_delta: small integers 0-8 based on the real chunk. vocabulary should rise only for real highlighted words.
`;

const FOLLOW_UP_PROMPT = `The student has paused for several seconds during their English science presentation practice.

Respond ONLY with valid JSON:
{
  "follow_up": "one short, content-aware question that helps them continue",
  "feedback": "one short supportive observation",
  "mood": "thinking"
}

Use the transcript/context from this chat. If there is little context, ask a useful starter question about cause, example, evidence, or impact. Avoid generic praise.
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type CharacterMood = "idle" | "listening" | "excited" | "thinking";

interface GeminiResult {
  transcript?: string;
  feedback?: string;
  highlight_words?: string[];
  follow_up?: string;
  mood?: string;
  highlight_moment?: boolean;
  score_delta?: Partial<KTVScore>;
  error?: string;
}

interface KTVScore { fluency: number; vocabulary: number; duration: number; flow: number }
interface HighlightFlash { id: number; points: number }

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
  return [...new Set(words.map((word) => word.trim()).filter(Boolean))].slice(0, 12);
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

// ─── AI Character ─────────────────────────────────────────────────────────────

function AICharacter({ mood, bubble }: { mood: CharacterMood; bubble: string | null }) {
  const face: Record<CharacterMood, string> = {
    idle: "😊", listening: "👂", excited: "🤩", thinking: "🤔",
  };
  const bg: Record<CharacterMood, string> = {
    idle:      "linear-gradient(135deg,#e0f0ff,#d4f5e4)",
    listening: "linear-gradient(135deg,#cce8ff,#b8f0d4)",
    excited:   "linear-gradient(135deg,#fff3b0,#ffe08a)",
    thinking:  "linear-gradient(135deg,#f0e8ff,#e0d4ff)",
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md transition-all duration-500"
        style={{ background: bg[mood], transform: mood === "excited" ? "scale(1.1)" : "scale(1)" }}>
        {face[mood]}
      </div>
      <div className="relative px-4 py-3 rounded-2xl text-sm font-bold text-gray-800 shadow-sm bg-white border border-gray-100 min-w-[190px] max-w-[300px] text-center leading-snug"
        style={{ transition: "opacity 0.3s", opacity: bubble ? 1 : 0.3 }}>
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid white" }} />
        {bubble || "…"}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PracticeRoom() {
  const navigate = useNavigate();

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
  const processingRef    = useRef(false);
  const maxExceededRef   = useRef(false);
  const sampleRateRef    = useRef(TARGET_SAMPLE_RATE);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // Transcript scroll
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldRestartRecognitionRef = useRef(false);
  const finalCaptionRef = useRef("");

  // Gemini refs
  const genAiRef        = useRef<GoogleGenerativeAI | null>(null);
  const chatSessionRef  = useRef<any>(null);
  const firstSentRef    = useRef(false);

  // Silence → bottleneck timer
  const bottleneckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFollowUpAtRef = useRef(0);

  // State
  const [started, setStarted]               = useState(false);
  const [timer, setTimer]                   = useState(0);
  const [highlightCount, setHighlightCount] = useState(0);
  const [ktvScore, setKtvScore]             = useState<KTVScore>({ fluency: 0, vocabulary: 0, duration: 0, flow: 0 });
  const [flashes, setFlashes]               = useState<HighlightFlash[]>([]);
  const [mood, setMood]                     = useState<CharacterMood>("idle");
  const [bubble, setBubble]                 = useState<string | null>("Ready to listen 👂");
  const [transcript, setTranscript]         = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [highlightWords, setHighlightWords] = useState<string[]>([]);
  const [showBottleneck, setShowBottleneck] = useState(false);
  const [followUpQ, setFollowUpQ]           = useState("");
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

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [started]);

  // Session duration score
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setKtvScore((p) => ({
        fluency:    p.fluency,
        vocabulary: p.vocabulary,
        duration:   Math.min(100, (timer / 180) * 100),
        flow:       p.flow,
      }));
    }, 3000);
    return () => clearInterval(id);
  }, [started, timer]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

      setInterimTranscript(interimParts.join(" ").replace(/\s+/g, " ").trim());
      setCaptionStatus("listening");
      if (apiStatus === "ready") setAiState("Live captions on");
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
  }, [apiStatus, stopLiveCaptions]);

  // ── Fetch Gemini API key ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-gemini-api-key", {});
        const key = data?.geminiApiKey;
        if (!key) throw new Error("No key returned");
        genAiRef.current = new GoogleGenerativeAI(key);
        setApiStatus("ready");
        setAiState("AI ready");
      } catch (e) {
        console.error("Gemini API key fetch failed:", e);
        setApiStatus("error");
        setAiState("AI offline");
        setBubble("AI offline - check Supabase");
      }
    })();
  }, []);

  // ── Send audio chunk to Gemini ─────────────────────────────────────────────
  const sendToGemini = useCallback(async (wavBlob: Blob): Promise<GeminiResult | null> => {
    if (!genAiRef.current) return null;
    try {
      setAiState("AI is listening to the last phrase");
      if (!chatSessionRef.current) {
        const model = genAiRef.current.getGenerativeModel({
          model: MODEL_NAME,
          generationConfig: { responseMimeType: "application/json" },
        });
        chatSessionRef.current = model.startChat({
          history: [],
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          ],
        });
        firstSentRef.current = false;
      }

      const audioB64  = await blobToBase64(wavBlob);
      const audioPart = { inlineData: { mimeType: "audio/wav", data: audioB64 } };
      const parts: any[] = firstSentRef.current ? [audioPart] : [SYSTEM_PROMPT, audioPart];
      firstSentRef.current = true;

      const result = await chatSessionRef.current.sendMessage(parts);
      const text   = result.response.text().trim();
      const parsed = parseGeminiJson(text);
      setAiState(parsed ? "AI reflected on your words" : "AI response needs retry");
      return parsed;
    } catch (e) {
      console.error("Gemini error:", e);
      setAiState("AI had trouble hearing that");
      return null;
    }
  }, []);

  const askGeminiForFollowUp = useCallback(async () => {
    if (!genAiRef.current || !isStartedRef.current || processingRef.current) return;
    processingRef.current = true;
    try {
      setAiState("AI is thinking of a question");
      if (!chatSessionRef.current) {
        const model = genAiRef.current.getGenerativeModel({
          model: MODEL_NAME,
          generationConfig: { responseMimeType: "application/json" },
        });
        chatSessionRef.current = model.startChat({
          history: [],
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          ],
        });
        firstSentRef.current = false;
      }

      const context = transcriptRef.current
        ? `Transcript so far: "${transcriptRef.current.slice(-900)}"`
        : "The student has not produced a clear transcript yet.";
      const parts = firstSentRef.current
        ? [`${FOLLOW_UP_PROMPT}\n\n${context}`]
        : [SYSTEM_PROMPT, `${FOLLOW_UP_PROMPT}\n\n${context}`];
      firstSentRef.current = true;

      const result = await chatSessionRef.current.sendMessage(parts);
      const parsed = parseGeminiJson(result.response.text());
      const question = parsed?.follow_up?.trim();
      if (question) {
        lastFollowUpAtRef.current = Date.now();
        setFollowUpQ(question);
        setShowBottleneck(true);
        setMood("thinking");
        setBubble(parsed?.feedback?.trim() || "Let's open the next idea.");
        setAiState("AI noticed your pause");
      }
    } catch (e) {
      console.error("Gemini follow-up error:", e);
      setAiState("AI follow-up paused");
    } finally {
      processingRef.current = false;
    }
  }, []);

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

      // Vocabulary highlights
      if (result.highlight_words?.length) {
        const cleanWords = uniqueCleanWords(result.highlight_words);
        setHighlightWords((prev) => {
          const nextWords = uniqueCleanWords([...prev, ...cleanWords]);
          highlightWordsRef.current = nextWords;
          return nextWords;
        });
      }

      const delta = result.score_delta || {};
      setKtvScore((p) => ({
        fluency: clampScore(p.fluency + (delta.fluency ?? (durationS > 2 ? 3 : 1))),
        vocabulary: clampScore(p.vocabulary + (delta.vocabulary ?? ((result.highlight_words?.length || 0) * 4))),
        duration: clampScore((timer / 180) * 100),
        flow: clampScore(p.flow + (delta.flow ?? (result.follow_up ? 1 : 3))),
      }));

      // Character mood + bubble
      const newMood: CharacterMood =
        result.mood === "excited" ? "excited"
        : result.mood === "thinking" ? "thinking"
        : "listening";
      setMood(newMood);
      setBubble(result.feedback || "Keep going! 💪");

      if (result.highlight_moment || (result.highlight_words?.length || 0) >= 2) {
        const pts = 12 + Math.min(18, Math.round(durationS * 2) + (result.highlight_words?.length || 0) * 3);
        const id = Date.now();
        setHighlightCount((n) => n + 1);
        setFlashes((p) => [...p, { id, points: pts }]);
        setTimeout(() => setFlashes((p) => p.filter((f) => f.id !== id)), 1400);
      }

      // Follow-up question
      if (result.follow_up && result.follow_up.trim()) {
        setFollowUpQ(result.follow_up.trim());
        setShowBottleneck(true);
        setMood("thinking");
      }

      // Reset to listening after 3s
      setTimeout(() => {
        setMood("listening");
        setBubble("Listening… 👂");
      }, 3000);

    } finally {
      processingRef.current = false;
    }
  }, [sendToGemini, timer]);

  // ── VAD / ScriptProcessor ─────────────────────────────────────────────────
  const startVAD = useCallback(() => {
    if (!scriptProcRef.current || !micSrcRef.current || !analyserRef.current || !audioCtxRef.current) return;

    scriptProcRef.current.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!isStartedRef.current || processingRef.current) return;
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
        phraseChunksRef.current.push(new Float32Array(input));
        allChunksRef.current.push(new Float32Array(input));
        silenceStartRef.current = now;
        // Cancel bottleneck timer on resumed speech
        if (bottleneckTimerRef.current) { clearTimeout(bottleneckTimerRef.current); bottleneckTimerRef.current = null; }
        setShowBottleneck(false);
      } else {
        const silenceMs = now - silenceStartRef.current;
        if (speakingRef.current && (silenceMs > SILENCE_DURATION_MSEC || maxExceededRef.current)) {
          maxExceededRef.current = false;
          processPhrase(false);
        } else if (speakingRef.current) {
          phraseChunksRef.current.push(new Float32Array(input));
          allChunksRef.current.push(new Float32Array(input));
        }

        // Bottleneck timer (4s total silence → ask follow-up)
        const canAskFollowUp = Date.now() - lastFollowUpAtRef.current > BOTTLENECK_SILENCE_MS + 2500;
        if (allChunksRef.current.length > 0 && silenceMs > BOTTLENECK_SILENCE_MS && canAskFollowUp && !bottleneckTimerRef.current && !showBottleneckRef.current) {
          bottleneckTimerRef.current = setTimeout(() => {
            if (!processingRef.current && phraseChunksRef.current.length > 0) processPhrase(false);
            else askGeminiForFollowUp();
            bottleneckTimerRef.current = null;
          }, 0);
        }
      }
    };

    micSrcRef.current.connect(analyserRef.current);
    analyserRef.current.connect(scriptProcRef.current);
    scriptProcRef.current.connect(audioCtxRef.current.destination);
  }, [askGeminiForFollowUp, processPhrase]);

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
    lastFollowUpAtRef.current = 0;
    finalCaptionRef.current = "";
    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setHighlightWords([]);
    setFollowUpQ("");
    setShowBottleneck(false);
    setKtvScore({ fluency: 0, vocabulary: 0, duration: 0, flow: 0 });
    setHighlightCount(0);
    setAiState("Listening for your first idea");

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
    };
  }, [stopLiveCaptions]);

  // ── Trigger manual highlight ───────────────────────────────────────────────
  const triggerHighlight = () => {
    const pts = 15 + Math.floor(Math.random() * 16);
    const id  = Date.now();
    setHighlightCount((n) => n + 1);
    setFlashes((p) => [...p, { id, points: pts }]);
    setMood("excited");
    setBubble(`Amazing! +${pts} ⭐`);
    setTimeout(() => {
      setFlashes((p) => p.filter((f) => f.id !== id));
      setMood("listening");
      setBubble("Keep that energy! 💪");
    }, 1800);
  };

  // ── End session ────────────────────────────────────────────────────────────
  const endSession = async () => {
    if (phraseChunksRef.current.length > 0 || shortBufferRef.current) await processPhrase(true);
    isStartedRef.current = false;
    stopLiveCaptions();
    cancelAnimationFrame(rafRef.current);
    scriptProcRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/session-end", { state: { timer, highlightCount, ktvScore, highlightWords: highlightWordsRef.current, transcript: transcriptRef.current } });
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const scoreColor = (v: number) =>
    v < 40 ? "#FF7A5C" : v < 70 ? "#FFC947" : v < 90 ? "#7ED957" : "#58A9FF";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 select-none relative overflow-hidden">

      {/* Highlight flash */}
      {flashes.map((f) => (
        <div key={f.id} className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at center,rgba(255,201,71,0.22) 0%,transparent 65%)",
            animation: "highlight-pop 1.2s ease-out forwards",
          }} />
          <span className="text-2xl font-black text-amber-500 drop-shadow" style={{ animation: "score-jump 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            +{f.points} ⭐
          </span>
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
          <button onClick={endSession} disabled={!started}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform border"
            style={{ background: "rgba(255,122,92,0.1)", borderColor: "rgba(255,122,92,0.4)", color: "#EF4444" }}>
            <StopCircle size={13} />End
          </button>
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
          <Brain size={15} className={apiStatus === "ready" ? "text-blue-500" : "text-gray-300"} />
          <span className="text-xs font-bold text-gray-700">{aiState}</span>
          <span className="ml-auto h-2 w-2 rounded-full"
            style={{ background: apiStatus === "ready" ? "#7ED957" : apiStatus === "loading" ? "#58A9FF" : "#FF7A5C" }} />
        </div>

        {/* KTV bars — compact */}
        <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1">
          {([
            { label: "Fluency", key: "fluency" as keyof KTVScore, icon: "🌊" },
            { label: "Vocab",   key: "vocabulary" as keyof KTVScore, icon: "📚" },
            { label: "Duration",key: "duration" as keyof KTVScore, icon: "⏱️" },
            { label: "Flow",    key: "flow" as keyof KTVScore, icon: "🔥" },
          ]).map(({ label, key, icon }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-xs">{icon}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${ktvScore[key]}%`, background: scoreColor(ktvScore[key]) }} />
              </div>
              <span className="text-xs font-mono text-gray-400 w-6 text-right">{Math.round(ktvScore[key])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BIG Waveform ── */}
      <div className="px-4 pb-2">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <canvas ref={canvasRef} width={420} height={220} style={{ width: "100%", height: 210 }} />
        </div>
        <p className="text-center text-xs text-gray-400 mt-1.5">
          {!started ? "Tap Start to begin" : micDenied ? "🎙️ Demo mode" : "🎙️ Listening…"}
        </p>
      </div>

      {/* ── AI Character (below waveform) ── */}
      <div className="flex justify-center pb-5 pt-2">
        {started ? (
          <AICharacter mood={mood} bubble={bubble} />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md"
              style={{ background: "linear-gradient(135deg,#e0f0ff,#d4f5e4)" }}>😊</div>
            <button onClick={startSession}
              disabled={apiStatus === "loading"}
              className="px-8 py-4 rounded-2xl text-base font-black text-white active:scale-95 transition-transform shadow-md disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#58A9FF,#7ED957)", boxShadow: "0 6px 20px rgba(88,169,255,0.3)" }}>
              {apiStatus === "loading" ? "Loading AI…" : "🎙️ Start Speaking"}
            </button>
          </div>
        )}
      </div>

      {/* ── Transcript (fixed small box, scrollable) ── */}
      {started && (
        <div className="px-4 pb-2 flex flex-col gap-1.5">
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100" style={{ height: 64 }}>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
              <MessageCircle size={12} />Transcript
            </div>
            <div className="text-sm text-gray-700 leading-relaxed overflow-y-auto pr-1" style={{ height: 34 }}>
              {applyHighlights(transcript, highlightWords).map((p, i) =>
                p.hl ? (
                  <mark key={i} className="px-0.5 rounded font-semibold"
                    style={{ background: "rgba(88,169,255,0.18)", color: "#2563EB" }}>{p.str}</mark>
                ) : <span key={i}>{p.str}</span>
              )}
              {interimTranscript && (
                <span className="font-semibold text-blue-500">
                  {transcript ? " " : ""}{interimTranscript}
                </span>
              )}
              {!transcript && !interimTranscript && (
                <span className="text-gray-300 italic">
                  {captionStatus === "unsupported"
                    ? "Live captions need Chrome or Edge..."
                    : captionStatus === "error"
                    ? "Live captions paused..."
                    : "Your words will appear here..."}
                </span>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Vocab chips */}
          {highlightWords.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {highlightWords.map((w) => (
                <span key={w} className="flex-shrink-0 text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(88,169,255,0.13)", color: "#2563EB" }}>
                  <Sparkles size={10} className="inline mr-1" />{w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottleneck card ── */}
      {showBottleneck && followUpQ && (
        <div className="px-4 pb-2">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-blue-100"
            style={{ animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <p className="text-xs font-bold text-blue-500 mb-1">AI noticed a pause</p>
            <p className="text-base font-bold text-gray-900 leading-snug mb-3">{followUpQ}</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowBottleneck(false); setMood("listening"); setBubble("That's it! 💪"); }}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#58A9FF,#7ED957)" }}>
                Got it ✓
              </button>
              <button onClick={() => { setShowBottleneck(false); setMood("listening"); setBubble("No worries 😊"); }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-500">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark highlight ── */}
      {started && (
        <div className="px-4 pb-6 mt-auto">
          <button onClick={triggerHighlight}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-transform border"
            style={{ background: "rgba(255,201,71,0.1)", borderColor: "rgba(255,201,71,0.5)", color: "#D97706" }}>
            <Zap size={16} />Save this moment
          </button>
        </div>
      )}
    </div>
  );
}
