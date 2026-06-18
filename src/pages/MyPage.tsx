import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, ClipboardList, Settings, ShieldCheck, Sparkles, TrendingUp, UserRound } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";
import { getSessions, type SessionRecord } from "@/lib/session-history";
import { TRYING_POINTS } from "@/lib/trying-point";

const ability = [
  { label: "Flow", value: 64, change: "+12", color: "#58A9FF" },
  { label: "Words", value: 58, change: "+9", color: "#7ED957" },
  { label: "Sentences", value: 46, change: "+6", color: "#FFC947" },
  { label: "Story", value: 71, change: "+15", color: "#FF7A5C" },
];

function relativeDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sessionTitle(s: SessionRecord): string {
  const words = s.transcript.trim().split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
  return words ? `${words}${s.transcript.trim().split(/\s+/).length > 6 ? "…" : ""}` : "Practice run";
}

export default function MyPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setSessions(getSessions()); }, []);

  // Real saved phrase bank — unique highlighted words across past runs.
  const savedPhrases = Array.from(new Set(sessions.flatMap((s) => s.highlightWords).map((w) => w.trim()).filter(Boolean)));

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex min-h-dvh flex-col gap-4 overflow-y-auto px-4 pb-28 pt-6">
        <section className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <UserRound size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-blue-500">My Page</p>
              <h1 className="text-2xl font-black text-gray-900">Alex's growth map</h1>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-600">
                <ShieldCheck size={11} /> Practice feedback only
              </span>
            </div>
            <button
              onClick={() => settingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 active:scale-95"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-green-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-green-500">Trying Point</p>
              <h2 className="mt-1 text-lg font-black text-gray-900">This week's visible upgrade</h2>
            </div>
            <Sparkles size={18} className="text-green-500" />
          </div>
          <div className="space-y-2">
            {TRYING_POINTS.map((point, index) => (
              <div key={point} className="flex items-center gap-3 rounded-2xl bg-green-50/70 px-3 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-green-600">
                  {index + 1}
                </span>
                <p className="text-sm font-bold leading-snug text-gray-800">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Practice growth</p>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="space-y-3">
            {ability.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-black text-gray-700">{item.label}</span>
                  <span className="text-xs font-black text-green-500">{item.change}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Practice history</p>
            <CalendarDays size={16} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            {sessions.length === 0 && (
              <p className="rounded-2xl bg-gray-50 px-3 py-4 text-center text-xs font-semibold text-gray-400">
                No practice runs saved yet. Finish a practice and it shows up here.
              </p>
            )}
            {sessions.map((item) => (
              <button key={item.id} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500">
                  <ClipboardList size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-gray-900">{sessionTitle(item)}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-400">
                    {relativeDay(item.createdAt)} · {item.mode} · {item.durationSeconds}s · {item.wordCount} words
                  </p>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            ))}
          </div>
        </section>

        <section ref={settingsRef} className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Settings</p>
          <div className="space-y-2">
            {/* Coach mode — a fixed trust boundary, shown as info (not a toggle) */}
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3">
              <ShieldCheck size={17} className="text-green-500" />
              <span className="flex-1 text-sm font-bold text-gray-800">Coach mode</span>
              <span className="text-xs font-semibold text-green-600">Practice feedback only</span>
            </div>

            {/* Saved phrase bank — real, aggregated from your practice history */}
            <button
              onClick={() => setPhrasesOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-left active:scale-[0.99]"
            >
              <Sparkles size={17} className="text-blue-500" />
              <span className="flex-1 text-sm font-bold text-gray-800">Saved phrase bank</span>
              <span className="text-xs font-semibold text-gray-400">{savedPhrases.length} {savedPhrases.length === 1 ? "phrase" : "phrases"}</span>
              <ChevronDown size={15} className="text-gray-300 transition-transform" style={{ transform: phrasesOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {phrasesOpen && (
              <div className="rounded-2xl bg-blue-50/50 px-3 py-3">
                {savedPhrases.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400">No saved phrases yet — finish a practice and your highlighted words show up here.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {savedPhrases.map((p) => (
                      <span key={p} className="rounded-full border border-blue-100 bg-white px-2 py-1 text-xs font-bold text-blue-600">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prompt focus — info row */}
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3">
              <Settings size={17} className="text-blue-500" />
              <span className="flex-1 text-sm font-bold text-gray-800">Prompt focus</span>
              <span className="text-xs font-semibold text-gray-400">Science presentation</span>
            </div>
          </div>
        </section>
      </div>
      <AppTabBar />
    </div>
  );
}
