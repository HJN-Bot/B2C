import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Star, ChevronRight, Mic, RefreshCw } from "lucide-react";
import { getSessions } from "@/lib/session-history";
import AppTabBar from "@/components/AppTabBar";
import CoachmarkTour, { hasSeenTour } from "@/components/CoachmarkTour";

const MOCK_USER = { name: "Alex", streak: 5 };
const HOME_TOUR = "speakspark.homeOnboarded";

const TOPIC_STARTERS = [
  "This house believes AI will help students more than it harms them.",
  "This house would ban homework in schools.",
  "Resolved: Space exploration is worth the cost.",
  "Should social media have a minimum age of 16?",
  "This house believes zoos do more good than harm.",
  "This house would make one science subject compulsory every year.",
];

const HIGHLIGHT_WAVE = [3, 5, 8, 12, 9, 6, 14, 10, 7, 11, 8, 5, 9, 12, 7, 4, 10, 6, 8, 5];

function snippet(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trim()}…` : t;
}

export default function Home() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(() => TOPIC_STARTERS[Math.floor(Math.random() * TOPIC_STARTERS.length)]);
  const shuffleTopic = () => setTopic((cur) => {
    if (TOPIC_STARTERS.length < 2) return cur;
    let next = cur;
    while (next === cur) next = TOPIC_STARTERS[Math.floor(Math.random() * TOPIC_STARTERS.length)];
    return next;
  });
  const [lastSession] = useState(() => getSessions()[0] ?? null);
  const [showTour, setShowTour] = useState(() => !hasSeenTour(HOME_TOUR));
  const topicRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {showTour && (
        <CoachmarkTour
          storageKey={HOME_TOUR}
          onDone={() => setShowTour(false)}
          steps={[
            { ref: topicRef, title: "Today's debate motion", body: "Here's a motion to argue — tap Another for a different one, or just talk about your own." },
            { ref: startRef, title: "Start practice", body: "One tap to start. You'll get live captions, a cat coach, and a takeaway when you finish." },
          ]}
        />
      )}
      <div className="flex-1 flex flex-col px-5 pt-6 pb-24 gap-4">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hey {MOCK_USER.name} 👋</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <CalendarCheck size={15} className="text-green-500" />
            <span className="text-sm text-gray-500">{MOCK_USER.streak} practices this week · nice work</span>
          </div>
        </div>

        {/* Debate motion card — the one prompt; the single Start button below uses it. */}
        <div ref={topicRef} className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={15} className="text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Today's debate motion</span>
            </div>
            <button onClick={shuffleTopic} className="flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-500 active:scale-95">
              <RefreshCw size={12} /> Another
            </button>
          </div>
          <p className="text-base font-semibold text-gray-800 leading-relaxed">
            "{topic}"
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-400">Tap Start Practice below to argue this — or just talk about your own.</p>
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

        <div className="flex-1" />

        {/* Single CTA — the one entry to the practice room; carries the motion above. */}
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
