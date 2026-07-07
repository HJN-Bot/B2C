import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Star, ChevronRight, Mic, RefreshCw } from "lucide-react";
import { PRACTICE_MODES, getPracticeMode, setPracticeMode, pickTopic, type PracticeModeId } from "@/lib/practice-mode";
import { getSessions } from "@/lib/session-history";
import AppTabBar from "@/components/AppTabBar";
import CoachmarkTour, { hasSeenTour } from "@/components/CoachmarkTour";

const MOCK_USER = { name: "Alex" };
const HOME_TOUR = "speakspark.homeOnboarded";

const HIGHLIGHT_WAVE = [3, 5, 8, 12, 9, 6, 14, 10, 7, 11, 8, 5, 9, 12, 7, 4, 10, 6, 8, 5];

function snippet(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trim()}…` : t;
}

export default function Home() {
  const navigate = useNavigate();
  const [modeId, setModeId] = useState<PracticeModeId>(() => getPracticeMode().id);
  const mode = PRACTICE_MODES.find((m) => m.id === modeId) ?? PRACTICE_MODES[0];
  const [topic, setTopic] = useState(() => pickTopic(mode));
  const [sessions] = useState(() => getSessions());
  const lastSession = sessions[0] ?? null;
  const weekCount = sessions.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 7 * 86_400_000).length;
  const weekLine = weekCount > 0
    ? `${weekCount} ${weekCount === 1 ? "practice" : "practices"} this week · nice work`
    : "Ready for your first challenge?";
  const [showTour, setShowTour] = useState(() => !hasSeenTour(HOME_TOUR));
  const sceneRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  const chooseScene = (id: PracticeModeId) => {
    setModeId(id);
    setPracticeMode(id);
    const next = PRACTICE_MODES.find((m) => m.id === id) ?? PRACTICE_MODES[0];
    setTopic(pickTopic(next));
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {showTour && (
        <CoachmarkTour
          storageKey={HOME_TOUR}
          onDone={() => setShowTour(false)}
          steps={[
            { ref: sceneRef, title: "Pick a scenario", body: "Debate, Science Talk, Exam Prep, or Free Talk — each gives you its own topics and coaches you a bit differently." },
            { ref: topicRef, title: "Your topic", body: "Here's one to speak on — tap Another for a different one, or just bring your own." },
            { ref: startRef, title: "Start practice", body: "One tap to start. You'll get live captions, a cat coach, and a takeaway when you finish." },
          ]}
        />
      )}
      <div className="flex-1 flex flex-col px-5 pt-10 pb-28 gap-5">

        {/* Greeting — with a waving hand and this week's real practice count. */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hey {MOCK_USER.name} <span className="wave-hand">👋</span></h1>
          <div className="mt-1 flex items-center gap-1.5">
            <CalendarCheck size={15} className="text-green-500" />
            <span className="text-sm text-gray-500">{weekLine}</span>
          </div>
        </div>

        {/* Scenario picker — each scenario has its own topic library + coach style */}
        <div ref={sceneRef}>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Practice scenario</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PRACTICE_MODES.map((m) => {
              const active = m.id === modeId;
              return (
                <button
                  key={m.id}
                  onClick={() => chooseScene(m.id)}
                  className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition active:scale-95 ${active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-gray-100 bg-white"}`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className={`text-sm font-black leading-tight ${active ? "text-blue-600" : "text-gray-700"}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 truncate text-xs font-semibold text-gray-400">{mode.blurb}</p>
        </div>

        {/* Topic card — FIXED height + clamped text so switching scenarios never
            changes its size or shifts the page. */}
        <div ref={topicRef} className="h-[144px] flex flex-col bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={15} className="text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Today's {mode.topicNoun}</span>
            </div>
            {topic && (
              <button onClick={() => setTopic(pickTopic(mode, topic))} className="flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-500 active:scale-95">
                <RefreshCw size={12} /> Another
              </button>
            )}
          </div>
          {topic ? (
            <>
              <p className="text-base font-semibold text-gray-800 leading-relaxed line-clamp-2">"{topic}"</p>
              <p className="mt-2 text-xs font-semibold text-gray-400">Tap Start Practice below to speak on this — or just talk about your own.</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-500 leading-relaxed">Talk about anything on your mind — the coach will follow your idea.</p>
          )}
        </div>

        {/* Last highlight — real last run, or an encouraging empty state */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Last Highlight ✨</span>
            <button onClick={() => navigate("/my")} className="flex items-center gap-1 text-xs font-medium text-blue-500">
              Library <ChevronRight size={13} />
            </button>
          </div>

          {lastSession ? (
            <button
              onClick={() => navigate("/my")}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-amber-100 transition active:scale-95"
            >
              <div className="flex items-end gap-0.5 h-6 mb-2.5">
                {HIGHLIGHT_WAVE.map((h, i) => (
                  <div key={i} className="flex-1 rounded-full"
                    style={{ height: `${h * 2}px`, background: `hsl(${36 + i * 5}, 88%, 56%)`, opacity: 0.7 }} />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-2.5">
                "{snippet(lastSession.transcript) || "You completed a practice run."}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-amber-400" />
                  <span className="text-sm font-bold text-amber-500">
                    {lastSession.highlightWords.length ? `${lastSession.highlightWords.length} phrases saved` : "Run saved"}
                  </span>
                  <span className="text-xs text-gray-400">· {lastSession.mode}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-blue-500">View <ChevronRight size={13} /></span>
              </div>
            </button>
          ) : (
            <div className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-dashed border-amber-200">
              <p className="text-sm font-bold text-gray-700">No highlights yet ✨</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">Finish your first practice and your best phrases show up here.</p>
            </div>
          )}
        </div>

        <div className="h-1" />

        {/* Single CTA — carries the selected scenario (saved) + topic. */}
        <button
          ref={startRef}
          onClick={() => navigate("/practice", { state: { topic } })}
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
