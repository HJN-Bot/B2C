import { supabase } from "@/integrations/supabase/client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Mic, StopCircle, Play, Pause, X, Headphones, BarChart, Eye, ChevronDownSquare } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AudioRecorder, // We will use its `analyzeAudio` part primarily.
  createAudioUrl,
  analyzeAudio,
  DetailedAnalysisResult
} from "@/utils/audioRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveReactionFeedback from "@/components/LiveReactionFeedback"; // Keep if needed, or replace with text.

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- Constants (Merged from App & Practice) ---
const MODEL_NAME = "gemini-1.5-flash-latest";
const INITIAL_PROMPT_TEXT = `
You are a helpful and encouraging speech coach.
Be gentle and give small suggestions that nudges the speaker to talk better without being too distracting or discouraging.

Return results in JSON format only with the following keys:
"coach": " If the speaker ever says the word "Coach", the user is asking the coach to give help or tips, so switch roles to a coach giving actionable advice that fully answers the speaker's question - listing 3 ideas with examples in 3 points, but keeping it concise and under 30 words, for example "1. Highlight a problem: Many pet owners struggle to socialize their pets. 2. Showcase solution: Your app connects pets for playdates. 3. Show impact: Happier pets, more social owners!"."
"live": "If the user does not say the word "Coach", then encourage like a coach or an audience might to a live talk in less than 6 words. Use positive reinforcement like "keep calm" if speaking too fast, and other similar encouragements for problems in pace, tone, volume or pitch variation, pausing or overusing filler words,  or by mirroring back what's being said like "**repeat keyword you mentioned**: that's right! / interesting! / tell me more!", or with observations like "you're diving deep", "you're bringing it home," and others like it. Include an emoji."
"review": "Give feedback on the content's storytelling, structure, and missing points, and suggest improvements based on the target audience and desired emotional impact. Give 3 points in 3 sentences with emojis and keep it short"
"transcript": "(transcription of this phrase, skip any instructions to the coach)"

Ensure the output is a **single, valid JSON** object. If you cannot provide a valid JSON with these fields for any reason, return a JSON with an "error" field explaining the issue.
`;

// VAD Parameters
const ENERGY_THRESHOLD = 0.003; // For Float32Array data from -1 to 1
const SILENCE_DURATION_MSEC = 500; // Increased silence duration for processing trigger
const TARGET_SAMPLE_RATE = 16000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 1024; // 🎤 Using a power of two
const MIN_DURATION_SECONDS = 3.0; // Reduced minimum duration slightly
const PAUSE_THRESHOLD_FOR_COACH_TOAST_MSEC = 1000;

const baseRadarMetricsConfig = [
  { subject: 'Pace', fullMark: 100 },
  { subject: 'Tonality', fullMark: 100 },
  { subject: 'Expression', fullMark: 100 },
  { subject: 'Energy', fullMark: 100 },
  { subject: 'Fluency', fullMark: 100 },
  { subject: 'Volume', fullMark: 100 },
  { subject: 'Articulation', fullMark: 100 },
];

const getInitialRadarData = () => baseRadarMetricsConfig.map(m => ({ ...m, score: 0 }));

// --- Helper Components ---
interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark: number;
}

interface RechartsRadarChartComponentProps {
  data: RadarDataPoint[];
  title?: string;
  isLive?: boolean;
}

const RechartsRadarChartComponent: React.FC<RechartsRadarChartComponentProps> = ({ data, title, isLive = false }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-4">Chart data is not available yet.</p>;
  }
  const processedData = data.map(item => ({
    ...item,
    score: Math.max(0, Math.min(item.score, 100)),
  }));
  return (
    <div style={{ width: '100%', height: isLive ? 300 : 350 }} className="my-2">
      {title && <h3 className="text-md font-semibold mb-1 text-center">{title}</h3>}
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={processedData}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} tickFormatter={(value) => `${value}`} tick={{ fontSize: 10, fill: '#6b7280' }} />
          <Radar name="Performance" dataKey="score" stroke={isLive ? "#a78bfa" : "#3b82f6"} fill={isLive ? "#a78bfa" : "#3b82f6"} fillOpacity={isLive ? 0.5 : 0.6} animationDuration={isLive ? 300 : 800} />
          {!isLive && <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />}
          {!isLive && <RechartsTooltip contentStyle={{ fontSize: '12px', padding: '5px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ReactionGallery = ({ collectedReactions }: { collectedReactions: string[] }) => {
  if (!collectedReactions || collectedReactions.length === 0) {
    return null;
  }
  return (
    <div className="my-6 p-4 border border-dashed border-yellow-400 rounded-lg bg-yellow-50/50">
      <h3 className="text-lg font-semibold mb-2 text-yellow-700 text-center">
        🌟 Woohoo! Your Audience Loved These Moments! 🌟
      </h3>
      <p className="text-sm text-yellow-600 text-center mb-4">
        You're doing great! Keep practicing to capture even more positive reactions.
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 p-3 bg-white/70 rounded-md shadow-inner">
        {collectedReactions.map((emoji, index) => (
          <div key={index} className="text-3xl sm:text-4xl p-2 bg-white rounded-lg shadow-md hover:scale-125 transform transition-all duration-200 ease-in-out flex items-center justify-center aspect-square cursor-default" title={`Positive reaction: ${emoji}`}>
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoreItem = ({
  label,
  score,
  description,
  highlight = false
}: {
  label: string;
  score: number;
  description: string;
  highlight?: boolean;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  return (
    <div className={cn("space-y-2 py-2", highlight && "border-l-4 border-blue-500 pl-3 -ml-3")}>
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className={cn("font-bold text-lg", getScoreColor(score))}>
          {score}/100
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
};

// --- Main Practice Component ---
const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/wav');
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [focusArea, setFocusArea] = useState<'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'>('all');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [finalRadarData, setFinalRadarData] = useState<RadarDataPoint[] | null>(null);
  const { toast } = useToast();

  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [status, setStatus] = useState('Idle. Ready to record.');
  const [liveFeedbackHistory, setLiveFeedbackHistory] = useState<string[]>([]);
  const [showLiveReactions, setShowLiveReactions] = useState(false);
  const [currentLiveFeedback, setCurrentLiveFeedback] = useState<string>('');
  const [sessionPhrases, setSessionPhrases] = useState<any[]>([]);
  const [isDisplayingCoachMessage, setIsDisplayingCoachMessage] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordedPhraseChunksRef = useRef<Float32Array[]>([]);
  const allRecordedChunksRef = useRef<Float32Array[]>([]);
  const silenceStartRef = useRef(Date.now());
  const speakingRef = useRef(false);
  const genAiRef = useRef<GoogleGenerativeAI | null>(null);
  const chatSessionRef = useRef<any | null>(null);
  const firstAudioSentThisSessionRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const shortPhraseBufferRef = useRef<Float32Array | null>(null);
  const initialSilenceToastShownRef = useRef(false);
  const longPauseToastShownThisPauseRef = useRef(false);

  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setStatus("Fetching API key...");
        setCurrentLiveFeedback("Getting Key...");
        const { data } = await supabase.functions.invoke("get-gemini-api-key", {});
        const key = data?.geminiApiKey;
        if (key) {
          setGeminiApiKey(key);
          genAiRef.current = new GoogleGenerativeAI(key);
          setStatus("Ready to record.");
          setCurrentLiveFeedback("");
        } else {
          throw new Error("API key not found in the response.");
        }
      } catch (error: any) {
        console.error("Error fetching Gemini API Key:", error);
        setStatus("Error: Failed to get API Key.");
        setCurrentLiveFeedback("API Key Error!");
        toast({
          title: "Configuration Error",
          description: `Could not fetch Gemini API Key: ${error.message}. Live feedback disabled.`,
          variant: "destructive",
        });
      }
    };
    fetchApiKey();
  }, [toast]);

  const float32To16BitPCM = useCallback((float32Array: Float32Array) => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return new DataView(pcm16.buffer);
  }, []);

  const getWavHeader = useCallback((dataByteLength: number, sampleRate: number, numChannels = 1, bitsPerSample = 16) => {
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataByteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataByteLength, true);
    return view;
  }, []);

  const createWavBlob = useCallback((float32Array: Float32Array, sampleRate: number) => {
    const pcmData = float32To16BitPCM(float32Array);
    const wavHeader = getWavHeader(pcmData.buffer.byteLength, sampleRate);
    return new Blob([wavHeader, pcmData], { type: 'audio/wav' });
  }, [float32To16BitPCM, getWavHeader]);

  const concatenateFloat32Arrays = useCallback((arrays: Float32Array[]) => {
    let totalLength = 0;
    for (const arr of arrays) totalLength += arr.length;
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }, []);

  const blobToBase64 = useCallback((blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const processAudioWithGemini = useCallback(async (wavBlob: Blob) => {
    if (!genAiRef.current) {
      setStatus("Error: Gemini SDK not initialized.");
      return { error: "Gemini SDK not initialized." };
    }
    if (!chatSessionRef.current) {
      try {
        const model = genAiRef.current.getGenerativeModel({ model: MODEL_NAME });
        chatSessionRef.current = model.startChat({
          history: [],
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          ],
        });
        firstAudioSentThisSessionRef.current = false;
        console.log("New Gemini chat session started.");
      } catch (error: any) {
        console.error("Error starting Gemini chat:", error);
        setStatus(`Error starting chat: ${error.message}.`);
        return { error: `Error starting chat: ${error.message}` };
      }
    }
    setStatus("Sending phrase to AI...");
    try {
      const audioBase64 = await blobToBase64(wavBlob);
      const audioPart = { inlineData: { mimeType: 'audio/wav', data: audioBase64 } };
      const messageParts = [];
      if (!firstAudioSentThisSessionRef.current) {
        messageParts.push(INITIAL_PROMPT_TEXT);
      }
      messageParts.push(audioPart);
      const result = await chatSessionRef.current.sendMessageStream(messageParts);
      let responseText = "";
      for await (const chunk of result.stream) {
        responseText += chunk.text();
      }
      console.log("Gemini Raw Response:", responseText);
      if (!firstAudioSentThisSessionRef.current) firstAudioSentThisSessionRef.current = true;
      let feedbackJson;
      const trimmedResponse = responseText.trim();
      if (trimmedResponse.startsWith("```json")) {
        feedbackJson = JSON.parse(trimmedResponse.slice(7, -3).trim());
      } else if (trimmedResponse.startsWith("```")) {
        feedbackJson = JSON.parse(trimmedResponse.slice(3, -3).trim());
      } else if (trimmedResponse.startsWith("{") && trimmedResponse.endsWith("}")) {
        feedbackJson = JSON.parse(trimmedResponse);
      } else {
        console.warn("Response not JSON, attempting direct parse or using as error.");
        try {
          feedbackJson = JSON.parse(trimmedResponse);
        } catch (e) {
          feedbackJson = { error: "AI response not in expected JSON format.", live: "Format Issue", transcript: "N/A", review: responseText };
        }
      }
      return feedbackJson;
    } catch (error: any) {
      console.error("Error communicating with Gemini:", error);
      let userMessage = `Gemini Error: ${error.message}`;
      if (error.message && (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID"))) {
        userMessage = "API Key is invalid. Live feedback disabled.";
        setGeminiApiKey(null);
        genAiRef.current = null;
        chatSessionRef.current = null;
      }
      setStatus(userMessage);
      return { error: userMessage };
    }
  }, [blobToBase64]);

  const processCurrentPhrase = useCallback(async (isFinal = false, silenceDurationMsec = 0) => {
    let allChunksToProcessRaw: Float32Array[] = [];
    if (shortPhraseBufferRef.current) {
      allChunksToProcessRaw.push(shortPhraseBufferRef.current);
      shortPhraseBufferRef.current = null;
    }
    allChunksToProcessRaw = [...allChunksToProcessRaw, ...recordedPhraseChunksRef.current];
    if (allChunksToProcessRaw.length === 0) {
      if (!isFinal) speakingRef.current = false;
      return;
    }
    const completePhraseData = concatenateFloat32Arrays(allChunksToProcessRaw);
    recordedPhraseChunksRef.current = [];
    if (!isFinal) speakingRef.current = false;
    const durationSeconds = completePhraseData.length / TARGET_SAMPLE_RATE;
    const silenceDurationSeconds = silenceDurationMsec / 1000;
    const shouldProcessDueToTime = !isFinal && (silenceDurationSeconds + durationSeconds > MIN_DURATION_SECONDS) && (durationSeconds > 0.5);

    if (isFinal || durationSeconds >= MIN_DURATION_SECONDS || shouldProcessDueToTime) {
      console.log(`Processing phrase (${durationSeconds.toFixed(1)}s). Final: ${isFinal}. Silence: ${silenceDurationSeconds.toFixed(1)}s. Reason: ${isFinal ? 'Final' : durationSeconds >= MIN_DURATION_SECONDS ? 'Duration' : 'Time'}`);
      setStatus('Processing phrase...');
      setShowLiveReactions(true);
      const wavBlob = createWavBlob(completePhraseData, TARGET_SAMPLE_RATE);
      const result = await processAudioWithGemini(wavBlob);

      if (result) {
        let feedbackTextToShow = '';
        let isCoachMsg = false;
        if (result.coach && typeof result.coach === 'string' && result.coach.trim() !== '') {
          feedbackTextToShow = result.coach;
          isCoachMsg = true;
        } else if (result.live && typeof result.live === 'string' && result.live.trim() !== '') {
          feedbackTextToShow = result.live;
        } else if (result.error) {
          feedbackTextToShow = `Error: ${result.error}`;
        } else {
          feedbackTextToShow = 'Processing...';
        }
        setCurrentLiveFeedback(feedbackTextToShow);
        setIsDisplayingCoachMessage(isCoachMsg);
        if (feedbackTextToShow && feedbackTextToShow !== 'Processing...' && !result.error) {
          setLiveFeedbackHistory(prev => [...prev, feedbackTextToShow]);
        }
        let phraseTranscript = "[No transcript provided]";
        if (result.error) phraseTranscript = "Error processing phrase.";
        else if (result.transcript && typeof result.transcript === 'string') phraseTranscript = result.transcript;

        let phraseReview = "[No review provided]";
        if (result.error) phraseReview = result.error;
        else if (result.review && typeof result.review === 'string') phraseReview = result.review;
        // Fallback if dedicated review is missing, but coach/live exists
        else if (isCoachMsg && result.coach) phraseReview = `Coach tip: ${result.coach}`;
        else if (!isCoachMsg && result.live) phraseReview = `Live feedback: ${result.live}`;

        setSessionPhrases(prev => [...prev, {
          id: Date.now(),
          transcript: phraseTranscript,
          review: phraseReview,
          error: !!result.error
        }]);
      } else {
        setCurrentLiveFeedback('Failed to process audio.');
        setIsDisplayingCoachMessage(false);
        setSessionPhrases(prev => [...prev, {
          id: Date.now(),
          transcript: "[No transcript - processing error]",
          review: "Failed to get response from AI.",
          error: true
        }]);
      }
    } else {
      console.log(`Phrase too short (${durationSeconds.toFixed(1)}s), buffering. Silence: ${silenceDurationSeconds.toFixed(1)}s.`);
      shortPhraseBufferRef.current = completePhraseData;
      setStatus('Listening...');
      setShowLiveReactions(true);
      return;
    }
    if (isRecordingRef.current && !isFinal) {
      setStatus('Listening...');
    }
  }, [concatenateFloat32Arrays, createWavBlob, processAudioWithGemini, setIsDisplayingCoachMessage]);

  const startVAD = useCallback(() => {
    if (!audioContextRef.current || !microphoneSourceRef.current || !analyserRef.current || !scriptProcessorRef.current) return;
    scriptProcessorRef.current.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!isRecordingRef.current) return;
      const inputData = event.inputBuffer.getChannelData(0);
      const now = Date.now();
      let sumSquares = 0.0;
      for (const sample of inputData) sumSquares += sample * sample;
      const rms = Math.sqrt(sumSquares / inputData.length);
      if (rms > ENERGY_THRESHOLD) {
        if (!speakingRef.current) {
          speakingRef.current = true;
          console.log("Speech started (VAD phrase).");
        }
        recordedPhraseChunksRef.current.push(new Float32Array(inputData));
        allRecordedChunksRef.current.push(new Float32Array(inputData));
        silenceStartRef.current = now;
        longPauseToastShownThisPauseRef.current = false;
      } else {
        const continuousSilenceSinceLastSpeechMsec = now - silenceStartRef.current;
        if (allRecordedChunksRef.current.length > 0 &&
          continuousSilenceSinceLastSpeechMsec > PAUSE_THRESHOLD_FOR_COACH_TOAST_MSEC &&
          !longPauseToastShownThisPauseRef.current) {
          toast({ description: "ask 'Coach' what to say" });
          longPauseToastShownThisPauseRef.current = true;
        }
        if (speakingRef.current) {
          if (continuousSilenceSinceLastSpeechMsec > SILENCE_DURATION_MSEC) {
            console.log(`VAD: Long silence detected (${continuousSilenceSinceLastSpeechMsec}ms), processing current phrase.`);
            processCurrentPhrase(false, continuousSilenceSinceLastSpeechMsec);
          } else {
            recordedPhraseChunksRef.current.push(new Float32Array(inputData));
            allRecordedChunksRef.current.push(new Float32Array(inputData));
          }
        } else {
          if (isRecordingRef.current && !initialSilenceToastShownRef.current && allRecordedChunksRef.current.length === 0) {
            toast({ description: "state your audience" });
            initialSilenceToastShownRef.current = true;
          }
        }
      }
    };
    microphoneSourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(scriptProcessorRef.current);
    scriptProcessorRef.current.connect(audioContextRef.current.destination);
  }, [processCurrentPhrase, toast]);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (!geminiApiKey) {
      toast({ title: "Cannot Record", description: "Gemini API key is missing.", variant: "destructive" });
      setStatus("Error: Gemini API Key missing.");
      return;
    }
    try {
      setLiveFeedbackHistory([]);
      setSessionPhrases([]);
      recordedPhraseChunksRef.current = [];
      allRecordedChunksRef.current = [];
      shortPhraseBufferRef.current = null;
      speakingRef.current = false;
      silenceStartRef.current = Date.now();
      initialSilenceToastShownRef.current = false;
      longPauseToastShownThisPauseRef.current = false;
      chatSessionRef.current = null;
      firstAudioSentThisSessionRef.current = false;
      setAnalysis(null);
      setAudioUrl(null);
      setAudioBlob(null);
      setFinalRadarData(null);
      setRecordingTime(0);
      setCurrentLiveFeedback('Listening...');
      setIsDisplayingCoachMessage(false);
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: TARGET_SAMPLE_RATE });
      microphoneSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      setIsRecording(true);
      setStatus('Listening...');
      startVAD();
      startTimer();
      toast({ title: "Recording started", description: "Speak clearly." });
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setStatus(`Error: ${err.message}.`);
      setCurrentLiveFeedback("Mic Error!");
      setIsRecording(false);
      toast({ title: "Recording failed", description: "Microphone access denied or unavailable.", variant: "destructive" });
    }
  };

  const stopRecording = async () => {
    if (!isRecordingRef.current && allRecordedChunksRef.current.length === 0) {
      setStatus("Session already stopped.");
      setIsRecording(false);
      return;
    }
    setStatus("Stopping session...");
    setIsRecording(false);
    stopTimer();
    setCurrentLiveFeedback('Processing final audio...');
    setIsDisplayingCoachMessage(false);
    console.log("Processing final phrase on stop...");
    await processCurrentPhrase(true, Date.now() - silenceStartRef.current);
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
    }
    if (analyserRef.current) analyserRef.current.disconnect();
    if (microphoneSourceRef.current) microphoneSourceRef.current.disconnect();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
    }
    audioContextRef.current = null;
    microphoneSourceRef.current = null;
    scriptProcessorRef.current = null;
    analyserRef.current = null;
    if (allRecordedChunksRef.current.length === 0) {
      setStatus('Session ended. Nothing recorded.');
      setCurrentLiveFeedback('No audio recorded.');
      toast({ title: "Recording stopped", description: "No audio detected.", variant: "warning" });
      resetRecording();
      return;
    }
    setStatus("Analyzing full recording...");
    setCurrentLiveFeedback('Analyzing...');
    toast({ title: "Recording complete", description: "Analyzing your performance..." });
    setAnalyzingAudio(true);
    const fullRecordingData = concatenateFloat32Arrays(allRecordedChunksRef.current);
    const finalBlob = createWavBlob(fullRecordingData, TARGET_SAMPLE_RATE);
    allRecordedChunksRef.current = [];
    setAudioBlob(finalBlob);
    const url = createAudioUrl(finalBlob);
    setAudioUrl(url);
    setMimeType('audio/wav');
    try {
      const result = await analyzeAudio(finalBlob, focusArea, 'audio/wav');
      setAnalysis(result);
      if (result) {
        const newFinalRadarData = [
          { subject: 'Pace', score: result.paceScore, fullMark: 100 },
          { subject: 'Tonality', score: result.tonalityScore, fullMark: 100 },
          { subject: 'Expression', score: result.detailedMetrics.pitchVariation, fullMark: 100 },
          { subject: 'Energy', score: Math.min(100, Math.floor(result.detailedMetrics.volumeVariation * 1.1 + 10)), fullMark: 100 },
          { subject: 'Fluency', score: Math.floor(result.fillerWordsScore), fullMark: 100 },
          { subject: 'Drama', score: Math.floor(result.pausesScore), fullMark: 100 },
        ].map(item => ({ ...item, score: Math.max(0, Math.min(100, Math.round(item.score))) }));
        setFinalRadarData(newFinalRadarData);
        toast({ title: "Analysis complete", description: `Overall score: ${result.overallScore}/100` });
        setCurrentLiveFeedback('');
      } else {
        toast({ title: "Analysis Failed", description: "Could not get detailed analysis.", variant: "destructive" });
        setCurrentLiveFeedback('Analysis failed.');
      }
    } catch (error) {
      console.error("Error during final analysis:", error);
      toast({ title: "Analysis error", description: "Problem processing your recording.", variant: "destructive" });
      setCurrentLiveFeedback('Analysis error.');
    } finally {
      setAnalyzingAudio(false);
      setStatus('Session ended. Review results or start again.');
      setShowLiveReactions(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setAnalysis(null);
    setRecordingTime(0);
    setShowPrompt(true);
    setFinalRadarData(null);
    setLiveFeedbackHistory([]);
    setSessionPhrases([]);
    setCurrentLiveFeedback('');
    setIsDisplayingCoachMessage(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    speakingRef.current = false;
    initialSilenceToastShownRef.current = false;
    longPauseToastShownThisPauseRef.current = false;
    recordedPhraseChunksRef.current = [];
    allRecordedChunksRef.current = [];
    shortPhraseBufferRef.current = null;
    silenceStartRef.current = Date.now();
    setStatus('Idle. Ready to record.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let currentAudioUrl = audioUrl;
    return () => {
      stopTimer();
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext on unmount:", e));
        audioContextRef.current = null;
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
      }
    };
  }, [audioUrl]);

  return (
    <Layout>
      <div className="p-4 space-y-5">
        <h1 className="text-2xl font-bold">Practice with Live Feedback</h1>

        {showPrompt && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Today's Practice</h3>
                {(audioUrl || analysis) && (
                  <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setShowPrompt(false)}>
                    <X size={18} />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-2">
                Practice giving a short 1-2 minute speech. We'll give you live feedback!
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col items-center justify-center py-4 rounded-lg">
          {!isRecording && !audioUrl && (
            <div className="text-center space-y-4">
              <div className="record-button mx-auto cursor-pointer p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" onClick={startRecording}>
                <Mic size={32} className="text-blue-600" />
              </div>
            </div>
          )}

          {isRecording && (
            <div className="text-center space-y-2 w-full">
              <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
              <div className="animate-pulse-light">
                <div className="record-button mx-auto cursor-pointer p-4 rounded-full bg-red-100 hover:bg-red-200 transition-colors" onClick={stopRecording}>
                  <StopCircle size={32} className="text-red-500" />
                </div>
              </div>
              <p className="text-sm">Recording... Tap to stop</p>
              <div className="mt-2 min-h-[80px] flex items-center justify-center">
                <LiveReactionFeedback isActive={showLiveReactions} />
              </div>
              <div className={cn(
                "mt-4 p-4 rounded-md w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto shadow-sm",
                "transition-all duration-300 ease-in-out",
                isDisplayingCoachMessage
                  ? "bg-sky-50 dark:bg-sky-800 border border-sky-300 dark:border-sky-700"
                  : "bg-purple-50 dark:bg-gray-700 min-h-[60px] flex items-center justify-center text-center"
              )}>
                <p className={cn(
                  "font-medium transition-colors duration-200",
                  isDisplayingCoachMessage
                    ? "text-sky-700 dark:text-sky-200 text-sm md:text-base text-left whitespace-pre-line"
                    : "text-purple-600 dark:text-purple-300 text-lg"
                )}>
                  {currentLiveFeedback}
                </p>
              </div>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className="w-full space-y-4 mt-4 px-4">
              <audio ref={audioRef} src={audioUrl} controls className="w-full" onEnded={() => setIsPlaying(false)} />
              <div className="flex items-center justify-center space-x-4">
                <Button variant="outline" className="w-12 h-12 rounded-full p-0" onClick={togglePlayback}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </Button>
              </div>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={resetRecording}> Record again </Button>
              </div>
            </div>
          )}
        </div>

        {analyzingAudio && (
          <div className="text-center py-6">
            <div className="inline-block animate-pulse-light">
              <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto"></div>
            </div>
            <p className="mt-3 text-sm">Analyzing your full recording...</p>
          </div>
        )}

        {(analysis || sessionPhrases.length > 0) && !isRecording && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart size={20} />
              Analysis Results
              {analysis && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Focus: {focusArea.replace('-', ' ')}
                </span>
              )}
            </h2>

            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="speech">Speech</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              {/* MODIFICATION: Transcript Tab Content */}
              <TabsContent value="transcript" className="pt-4 space-y-6">
                {/* MODIFICATION: Moved ReactionGallery here */}
                {<ReactionGallery collectedReactions={["🤩", "🎉", "👏", "👍", "💯", "🥳", "🙌", "✨", "🎯", "💡", "🔥", "✅"]} />}

                {analysis && analysis.transcription && (
                  <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Full Recording Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded text-sm whitespace-pre-wrap max-h-80 overflow-y-auto border dark:border-gray-700 shadow-inner">
                            {analysis.transcription}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Note: AI-generated transcription, may not be 100% accurate.
                        </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* MODIFICATION: "Deep Dive" accordion now only for session phrases */}
                {(sessionPhrases.length > 0 || (analysis && !analysis.transcription && (!analysis.contentSuggestions || analysis.contentSuggestions.length ===0))) && ( // Show accordion if phrases exist, or if analysis exists but no transcript/suggestions yet to avoid empty tab
                    <Accordion type="single" collapsible className="w-full" defaultValue={sessionPhrases.length > 0 ? "live-feedback-phrases" : ""}>
                      <AccordionItem value="live-feedback-phrases">
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline text-gray-800 dark:text-gray-200 flex items-center gap-2 py-3 px-1">
                          <ChevronDownSquare size={22} className="text-purple-500" />
                          <span>Deep Dive: Detailed Improvements</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-0">
                            <Card className="border-none shadow-none">
                              <CardContent className="p-0 md:p-4 space-y-6">
                                {sessionPhrases.length > 0 ? (
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Increased max-h */}
                                    {sessionPhrases.map((phrase, index) => (
                                        <div
                                          key={phrase.id}
                                          className={`p-4 rounded-md shadow-sm ${phrase.error ? 'bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500' : 'bg-gray-50 dark:bg-gray-700/50 border-l-4 border-blue-500'}`}
                                        >
                                          <div className="mb-3">
                                            <span className="text-xs text-purple-500 dark:text-purple-300 font-mono uppercase tracking-wider block mb-1">
                                              Phrase {index + 1}:
                                            </span>
                                            <p className={`text-sm text-gray-800 dark:text-gray-100 leading-relaxed ${phrase.error && !phrase.transcript.startsWith("Error") ? 'italic' : ''}`}>
                                              {phrase.transcript}
                                            </p>
                                          </div>
                                          {/* MODIFICATION: Displaying phrase.review for each phrase */}
                                          {(phrase.review && !phrase.error) && ( // Only show review if it exists and not an error message already in transcript
                                            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                                              <span className="text-xs text-yellow-600 dark:text-yellow-300 font-mono uppercase tracking-wider block mb-1">
                                                Coach's Suggestion
                                              </span>
                                              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                                {phrase.review}
                                              </p>
                                            </div>
                                          )}
                                          {phrase.error && phrase.review && phrase.review.startsWith("Error") && ( // If review itself is an error message
                                               <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                                                <span className="text-xs text-red-600 dark:text-red-400 font-mono uppercase tracking-wider block mb-1">
                                                    Processing Note
                                                </span>
                                                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed whitespace-pre-line">
                                                    {phrase.review}
                                                </p>
                                               </div>
                                          )}
                                        </div>
                                    ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                                        No live feedback phrases were recorded during this session.
                                    </p>
                                )}
                              </CardContent>
                            </Card>
                          </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                )}
                {/* Fallback if no content for transcript tab at all */}
                {!analysis && sessionPhrases.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 italic text-center py-6">
                      No transcript data or live phrases available for this session yet.
                  </p>
                )}

                {analysis && analysis.contentSuggestions && analysis.contentSuggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                        <CardTitle className="text-lg text-blue-600 dark:text-blue-400">💡 Content Improvement Ideas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 list-disc list-inside pl-1">
                            {analysis.contentSuggestions.slice(0, 5).map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/30 p-3 rounded shadow-sm border border-blue-200 dark:border-blue-700">
                                {suggestion}
                            </li>
                            ))}
                        </ul>
                        <div className="text-center mt-5 p-3 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
                            <p className="text-sm text-green-700 dark:text-green-300">
                            Great effort! Why not try incorporating some of these ideas and <Button variant="link" className="p-0 h-auto text-sm text-green-600 dark:text-green-400 hover:underline" onClick={resetRecording}>record again</Button>?
                            </p>
                        </div>
                    </CardContent>
                  </Card>
                )}

              </TabsContent>

              {analysis && (
                <>
                  <TabsContent value="overview" className="pt-4">
                    {finalRadarData && (
                      <Card>
                        <CardHeader className="pb-2 pt-4">
                          <CardTitle className="text-lg text-center">Final Performance Radar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <RechartsRadarChartComponent data={finalRadarData} />
                        </CardContent>
                      </Card>
                    )}
                    <div className="pt-6 border-t mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-md">Overall Score</span>
                        <span className={cn(
                          "text-xl font-bold",
                          analysis.overallScore >= 80 ? "text-green-600" :
                            analysis.overallScore >= 60 ? "text-yellow-600" :
                              "text-red-600"
                        )}>
                          {analysis.overallScore}/100
                        </span>
                      </div>
                      <Progress value={analysis.overallScore} className="h-3" />
                    </div>
                  </TabsContent>

                  <TabsContent value="speech" className="space-y-1 pt-4">
                    <ScoreItem label="Pace" score={analysis.paceScore} description="Speaking rate" highlight={focusArea === 'rate-volume' || focusArea === 'all'} />
                    <ScoreItem label="Tonality" score={analysis.tonalityScore} description="Tone and feel" highlight={focusArea === 'pitch-tonality' || focusArea === 'all'} />
                    <ScoreItem label="Expression" score={analysis.detailedMetrics.pitchVariation} description="Pitch variation" highlight={focusArea === 'pitch-tonality' || focusArea === 'all'} />
                    <ScoreItem label="Energy" score={Math.floor(analysis.detailedMetrics.volumeVariation * 1.1 + 10)} description="Volume variation" highlight={focusArea === 'rate-volume' || focusArea === 'all'} />
                    <ScoreItem label="Drama" score={analysis.pausesScore} description="Use of pauses" highlight={focusArea === 'pause-fillers' || focusArea === 'all'} />
                    <ScoreItem label="Fluency" score={analysis.fillerWordsScore} description="Minimizing 'um', 'uh'" highlight={focusArea === 'pause-fillers' || focusArea === 'all'} />
                  </TabsContent>

                  <TabsContent value="metrics" className="pt-4">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-md">Speaking Metrics</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Words per minute</p>
                              <p className="text-xl font-semibold">{analysis.detailedMetrics.wordsPerMinute}</p>
                              <p className="text-xs text-gray-400">{analysis.detailedMetrics.wordsPerMinute > 160 ? "Faster" : analysis.detailedMetrics.wordsPerMinute < 130 ? "Slower" : "Good pace"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Volume variation</p>
                              <p className="text-xl font-semibold">{Math.floor(analysis.detailedMetrics.volumeVariation * 1.1 + 10)}/100</p>
                              <p className="text-xs text-gray-400">{analysis.detailedMetrics.volumeVariation > 75 ? "Excellent" : analysis.detailedMetrics.volumeVariation < 50 ? "Monotonous" : "Good"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-md">Pauses & Filler Words</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Strategic pauses</p>
                              <p className="text-xl font-semibold">{analysis.detailedMetrics.pauseMetrics.totalPauses}</p>
                              <p className="text-xs text-gray-400">Avg: {analysis.detailedMetrics.pauseMetrics.averagePauseDuration.toFixed(1)}s</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Filler words</p>
                              <p className="text-xl font-semibold">{analysis.detailedMetrics.fillerWordCount.total}</p>
                              <p className="text-xs text-gray-400">(um: {analysis.detailedMetrics.fillerWordCount.um}, uh: {analysis.detailedMetrics.fillerWordCount.uh}, etc.)</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-md">Pitch Analysis</CardTitle></CardHeader>
                        <CardContent>
                          <div>
                            <p className="text-sm text-gray-500">Pitch variation</p>
                            <p className="text-xl font-semibold">{analysis.detailedMetrics.pitchVariation}/100</p>
                            <p className="text-xs text-gray-400">{analysis.detailedMetrics.pitchVariation > 75 ? "Excellent" : analysis.detailedMetrics.pitchVariation < 50 ? "Monotonous" : "Good"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="feedback" className="pt-4">
                    <div className="space-y-5">
                      {/* MODIFICATION: ReactionGallery was moved from here */}
                      <div className="space-y-3">
                        <h3 className="text-md font-semibold">General Feedback</h3>
                        {analysis.feedback.length > 0 ? analysis.feedback.map((item, index) => (<div key={index} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg shadow-sm border dark:border-gray-600"><p className="text-sm">{item}</p></div>)) : <p className="text-sm text-gray-500 italic">No general feedback.</p>}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-md font-semibold">Improvement Suggestions</h3>
                        <Card><CardContent className="p-4"><h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">Pace</h4>{analysis.specificSuggestions.pace.length > 0 ? (<ul className="space-y-2 list-disc list-inside">{analysis.specificSuggestions.pace.map((suggestion, index) => (<li key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">{suggestion}</li>))}</ul>) : <p className="text-sm text-gray-500 italic">No suggestions.</p>}</CardContent></Card>
                        <Card><CardContent className="p-4"><h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">Pitch</h4>{analysis.specificSuggestions.pitch.length > 0 ? (<ul className="space-y-2 list-disc list-inside">{analysis.specificSuggestions.pitch.map((suggestion, index) => (<li key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">{suggestion}</li>))}</ul>) : <p className="text-sm text-gray-500 italic">No suggestions.</p>}</CardContent></Card>
                        <Card><CardContent className="p-4"><h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">Fillers</h4>{analysis.specificSuggestions.fillers.length > 0 ? (<ul className="space-y-2 list-disc list-inside">{analysis.specificSuggestions.fillers.map((suggestion, index) => (<li key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">{suggestion}</li>))}</ul>) : <p className="text-sm text-gray-500 italic">No suggestions.</p>}</CardContent></Card>
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>

            {analysis && (
              <div className="pt-4">
                <Button className="w-full" size="lg">Save to My Progress</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Practice;