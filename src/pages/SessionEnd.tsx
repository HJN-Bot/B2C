import { useNavigate, useLocation } from "react-router-dom";
import { Star, ChevronRight, Volume2, RotateCcw, BookOpen, Flame } from "lucide-react";
import { useEffect, useState } from "react";

interface KTVScore {
  fluency: number;
  vocabulary: number;
  duration: number;
  flow: number;
}

interface LocationState {
  timer?: number;
  highlightCount?: number;
  ktvScore?: KTVScore;
}

const MOCK_HIGHLIGHTS = [
  {
    id: 1,
    text: "AI is transforming healthcare by analyzing millions of patient records to predict diseases before symptoms appear.",
    pts: 28, tag: "Evidence",
    wave: [4, 7, 10, 14, 11, 8, 16, 12, 9, 13, 7, 5, 11, 9, 6],
  },
  {
    id: 2,
    text: "For example, self-driving cars use deep learning to process 1 million data points per second.",
    pts: 22, tag: "Vocabulary",
    wave: [6, 9, 5, 12, 8, 14, 10, 7, 13, 9, 6, 11, 8, 5, 7],
  },
  {
    id: 3,
    text: "Furthermore, this technology reduces human error, responsible for 90% of traffic accidents.",
    pts: 18, tag: "Fluency",
    wave: [3, 8, 6, 10, 14, 9, 7, 12, 8, 11, 6, 9, 5, 8, 10],
  },
];

const NEXT_TIP = 'Try adding more transition phrases like "This means that…" or "Building on this idea…" to connect your points more smoothly.';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function calcScore(k: KTVScore) {
  return Math.round(k.fluency * 0.35 + k.vocabulary * 0.25 + k.duration * 0.2 + k.flow * 0.2);
}

function scoreColor(v: number) {
  if (v < 40) return "#FF7A5C";
  if (v < 70) return "#FFC947";
  if (v < 90) return "#7ED957";
  return "#58A9FF";
}

export default function SessionEnd() {
  const navigate    = useNavigate();
  const { state }   = useLocation() as { state: LocationState | null };

  const timer          = state?.timer          ?? 143;
  const highlightCount = state?.highlightCount ?? 3;
  const ktvScore: KTVScore = state?.ktvScore ?? { fluency: 78, vocabulary: 62, duration: 80, flow: 71 };

  const totalScore       = calcScore(ktvScore);
  const [displayScore, setDisplayScore] = useState(0);
  const [showCards, setShowCards]       = useState(false);
  const [showTip, setShowTip]           = useState(false);
  const [showStreak, setShowStreak]     = useState(false);

  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setDisplayScore(Math.round((frame / 60) * totalScore));
      if (frame >= 60) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [totalScore]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCards(true),  800);
    const t2 = setTimeout(() => setShowTip(true),   1400);
    const t3 = setTimeout(() => setShowStreak(true), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col px-5 pt-8 pb-10 gap-5 overflow-y-auto">

        {/* ── Trophy + Score ── */}
        <div
          className="flex flex-col items-center gap-3"
          style={{ animation: "trophy-reveal 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        >
          <div className="text-6xl drop-shadow">🏆</div>
          <h1 className="text-2xl font-black text-gray-900">Session Complete!</h1>
          <div className="text-5xl font-black text-amber-500 tabular-nums">{displayScore}</div>
          <p className="text-sm text-gray-400">{formatTime(timer)} · {highlightCount} highlights</p>
        </div>

        {/* ── KTV breakdown ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          {[
            { label: "Fluency",   icon: "🌊", val: ktvScore.fluency },
            { label: "Vocabulary", icon: "📚", val: ktvScore.vocabulary },
            { label: "Duration",  icon: "⏱️", val: ktvScore.duration },
            { label: "Flow",      icon: "🔥", val: ktvScore.flow },
          ].map(({ label, icon, val }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm w-5 text-center">{icon}</span>
              <span className="text-xs w-16 font-medium text-gray-500">{label}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${val}%`, background: scoreColor(val), transition: "width 1.2s ease-out" }}
                />
              </div>
              <span className="text-xs font-mono font-bold w-7 text-right" style={{ color: scoreColor(val) }}>
                {Math.round(val)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Highlights ── */}
        {showCards && (
          <div style={{ animation: "float-in 0.5s ease-out forwards" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Your Highlights ✨ ({highlightCount})
              </span>
              <button className="flex items-center gap-1 text-xs font-medium text-blue-500">
                Save All <ChevronRight size={13} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {MOCK_HIGHLIGHTS.slice(0, Math.max(1, highlightCount)).map((h) => (
                <div
                  key={h.id}
                  className="flex-shrink-0 w-52 bg-white rounded-2xl p-4 shadow-sm border border-amber-100"
                >
                  <div className="flex items-end gap-0.5 h-7 mb-3">
                    {h.wave.map((v, i) => (
                      <div key={i} className="flex-1 rounded-full"
                        style={{ height: `${v * 2}px`, background: `hsl(${36 + i * 5}, 85%, 56%)`, opacity: 0.7 }} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 mb-3">"{h.text}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star size={11} className="text-amber-400" />
                      <span className="text-xs font-bold text-amber-500">{h.pts} pts</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {h.tag}
                      </span>
                    </div>
                    <button className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(88,169,255,0.12)" }}>
                      <Volume2 size={11} className="text-blue-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Next tip ── */}
        {showTip && (
          <div
            className="bg-white rounded-2xl p-4 shadow-sm border border-green-100"
            style={{ animation: "float-in 0.5s ease-out forwards" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7ED957" }}>
              💡 Next Practice Tip
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{NEXT_TIP}</p>
          </div>
        )}

        {/* ── Streak nudge ── */}
        {showStreak && (
          <div
            className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-orange-100"
            style={{ animation: "float-in 0.5s ease-out forwards" }}
          >
            <Flame size={30} className="text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900">Come back tomorrow!</p>
              <p className="text-xs text-gray-400 mt-0.5">🔓 Day 6 unlocks "Streak Master" badge</p>
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate("/practice")}
            className="flex-1 py-4 rounded-2xl text-base font-black text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
            style={{
              background: "linear-gradient(135deg, #58A9FF, #7ED957)",
              boxShadow: "0 6px 18px rgba(88,169,255,0.3)",
            }}
          >
            <RotateCcw size={18} />
            Practice Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-4 rounded-2xl text-sm font-bold bg-white border border-gray-200 text-gray-700 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <BookOpen size={16} />
            Library
          </button>
        </div>

      </div>
    </div>
  );
}
