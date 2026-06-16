import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Star, Volume2, ChevronRight, Lightbulb, Target } from "lucide-react";
import { PRACTICE_MODES, getPracticeMode, setPracticeMode, type PracticeModeId } from "@/lib/practice-mode";
import { currentTryingPoint } from "@/lib/trying-point";
import AppTabBar from "@/components/AppTabBar";
import CoachmarkTour, { hasSeenTour } from "@/components/CoachmarkTour";

const MOCK_USER = { name: "Alex", streak: 5 };
const HOME_TOUR = "speakspark.homeOnboarded";

const TOPIC_STARTERS = [
  "How is AI changing the way doctors diagnose diseases?",
  "Why is renewable energy the key to our planet's future?",
  "How do self-driving cars make decisions in real time?",
  "What makes CRISPR a revolutionary tool in genetics?",
];

const MOCK_LAST_HIGHLIGHT = {
  text: "AI is transforming healthcare by analyzing millions of patient records to predict diseases before symptoms appear.",
  score: 92,
  dimension: "Vocabulary",
  wave: [3, 5, 8, 12, 9, 6, 14, 10, 7, 11, 8, 5, 9, 12, 7, 4, 10, 6, 8, 5],
};

export default function Home() {
  const navigate = useNavigate();
  const topic = TOPIC_STARTERS[Math.floor(Math.random() * TOPIC_STARTERS.length)];
  const [modeId, setModeId] = useState<PracticeModeId>(() => getPracticeMode().id);
  const [showTour, setShowTour] = useState(() => !hasSeenTour(HOME_TOUR));
  const modeRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  const chooseMode = (id: PracticeModeId) => {
    setModeId(id);
    setPracticeMode(id);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {showTour && (
        <CoachmarkTour
          storageKey={HOME_TOUR}
          onDone={() => setShowTour(false)}
          steps={[
            { ref: modeRef, title: "Pick how you practice", body: "Free Talk, Exam Prep, or Story — this sets the coach's style for your whole run. You can switch anytime." },
            { ref: topicRef, title: "Need an idea?", body: "Stuck on what to say? Tap Use this topic to start with a science prompt, or My own to bring your own." },
            { ref: startRef, title: "Start practice", body: "Tap here when you're ready. You'll get live captions, a cat coach, and a takeaway when you finish." },
          ]}
        />
      )}
      <div className="flex-1 flex flex-col px-5 pt-8 pb-28 gap-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hey {MOCK_USER.name} 👋</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <CalendarCheck size={15} className="text-green-500" />
            <span className="text-sm text-gray-500">{MOCK_USER.streak} practices this week · nice work</span>
          </div>
        </div>

        {/* This week's trying point — one private upgrade, shared with Takeaway + My */}
        <button
          onClick={() => navigate("/practice")}
          className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/60 p-3.5 text-left transition active:scale-95"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-green-600">
            <Target size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-black uppercase tracking-widest text-green-600">This week's trying point</span>
            <span className="mt-0.5 block text-sm font-bold leading-snug text-gray-800">{currentTryingPoint()}</span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-green-400" />
        </button>

        {/* Practice mode — carried into PracticeRoom + Takeaway */}
        <div ref={modeRef}>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Practice mode</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PRACTICE_MODES.map((mode) => {
              const active = mode.id === modeId;
              return (
                <button
                  key={mode.id}
                  onClick={() => chooseMode(mode.id)}
                  className={`rounded-2xl border p-3 text-center transition active:scale-95 ${active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-gray-100 bg-white"}`}
                >
                  <div className="text-lg">{mode.emoji}</div>
                  <div className={`mt-1 text-xs font-black leading-tight ${active ? "text-blue-600" : "text-gray-700"}`}>
                    {mode.label.replace(" Mode", "")}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs font-semibold text-gray-400">{PRACTICE_MODES.find((m) => m.id === modeId)?.blurb}</p>
        </div>

        {/* Topic starter card — solves "no inspiration" pain point */}
        <div ref={topicRef} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Today's Starter</span>
          </div>
          <p className="text-base font-semibold text-gray-800 leading-relaxed mb-4">
            "{topic}"
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/practice", { state: { topic } })}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #58A9FF, #7ED957)" }}
            >
              Use this topic 🎙️
            </button>
            <button
              onClick={() => navigate("/practice")}
              className="px-4 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100"
            >
              My own
            </button>
          </div>
        </div>

        {/* Last highlight */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Last Highlight ✨</span>
            <button className="flex items-center gap-1 text-xs font-medium text-blue-500">
              Library <ChevronRight size={13} />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
            <div className="flex items-end gap-0.5 h-7 mb-3">
              {MOCK_LAST_HIGHLIGHT.wave.map((h, i) => (
                <div key={i} className="flex-1 rounded-full"
                  style={{ height: `${h * 2.2}px`, background: `hsl(${36 + i * 5}, 88%, 56%)`, opacity: 0.7 }} />
              ))}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-3">
              "{MOCK_LAST_HIGHLIGHT.text}"
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={13} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-500">Phrase saved</span>
                <span className="text-xs text-gray-400">· {MOCK_LAST_HIGHLIGHT.dimension} win</span>
              </div>
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50">
                <Volume2 size={14} className="text-blue-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Single CTA */}
        <button
          ref={startRef}
          onClick={() => navigate("/practice")}
          className="w-full py-5 rounded-2xl text-lg font-black text-white flex items-center justify-center gap-3 active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, #58A9FF, #7ED957)",
            boxShadow: "0 6px 20px rgba(88,169,255,0.3)",
          }}
        >
          <span className="text-2xl">🎙️</span>
          Start Practice
        </button>

      </div>
      <AppTabBar />
    </div>
  );
}
