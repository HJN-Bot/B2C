import { useEffect, useRef, useState } from "react";
import { Bookmark, CalendarDays, ChevronDown, ChevronRight, ClipboardList, Settings, ShieldCheck, Sparkles, TrendingUp, UserRound } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";
import { Calendar } from "@/components/ui/calendar";
import { getSessions, type SessionRecord } from "@/lib/session-history";
import { TRYING_POINTS } from "@/lib/trying-point";
import { getCustomPrompt, setCustomPrompt } from "@/lib/coach-prefs";
import { getVocab, removeVocab, type VocabItem } from "@/lib/vocab-bank";

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

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

function sessionTitle(s: SessionRecord): string {
  const words = s.transcript.trim().split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
  return words ? `${words}${s.transcript.trim().split(/\s+/).length > 6 ? "…" : ""}` : "Practice run";
}

export default function MyPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [promptOpen, setPromptOpen] = useState(false);
  const [customPrompt, setCustomPromptState] = useState<string>(() => getCustomPrompt());
  const [vocab, setVocab] = useState<VocabItem[]>(() => getVocab());
  const settingsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setSessions(getSessions()); }, []);

  // Real saved phrase bank — unique highlighted words across past runs.
  const savedPhrases = Array.from(new Set(sessions.flatMap((s) => s.highlightWords).map((w) => w.trim()).filter(Boolean)));
  const practicedDates = Array.from(
    new Map(sessions.map((s) => {
      const date = new Date(s.createdAt);
      return [dayKey(date), date] as const;
    })).values()
  );
  const visibleSessions = selectedDate
    ? sessions.filter((s) => sameDay(new Date(s.createdAt), selectedDate))
    : sessions;
  const historyLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "All days";

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

        {/* Vocab bank — the word upgrades you bookmarked in Takeaways, to review. */}
        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Vocab bank{vocab.length ? ` · ${vocab.length}` : ""}</p>
            <Bookmark size={16} className="text-green-500" />
          </div>
          {vocab.length === 0 ? (
            <p className="rounded-2xl bg-gray-50 px-3 py-4 text-center text-xs font-semibold text-gray-400">
              No saved words yet — in a Takeaway, tap 🔖 on a word upgrade to save it here.
            </p>
          ) : (
            <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {vocab.map((v) => (
                <div key={v.id} className="flex items-start gap-2 rounded-2xl bg-gray-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-gray-800">
                      {v.from && <span className="text-gray-400 line-through">{v.from} </span>}
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">{v.to}</span>
                    </p>
                    {v.context && <p className="mt-0.5 text-[11px] font-semibold text-gray-400">in: “{v.context}”</p>}
                  </div>
                  <button onClick={() => setVocab(removeVocab(v.id))} aria-label="Remove word" className="shrink-0 px-1 text-sm font-black leading-none text-gray-300 active:scale-90">×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Practice history{visibleSessions.length > 3 ? ` · ${visibleSessions.length}` : ""}</p>
            <button
              onClick={() => setCalendarOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-500 active:scale-95"
            >
              <CalendarDays size={14} className="text-gray-400" />
              {historyLabel}
            </button>
          </div>
          {calendarOpen && (
            <div className="mb-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ practiced: practicedDates }}
                modifiersClassNames={{
                  practiced: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-500",
                }}
                className="mx-auto w-fit p-1"
                classNames={{
                  caption_label: "text-xs font-black text-gray-700",
                  head_cell: "w-8 text-[10px] font-bold text-gray-400",
                  cell: "relative h-8 w-8 p-0 text-center",
                  day: "h-8 w-8 rounded-full p-0 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600",
                  day_today: "bg-green-50 text-green-600",
                  day_selected: "bg-blue-500 text-white hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white",
                  day_outside: "text-gray-300 opacity-50",
                }}
              />
              <div className="mt-1 flex items-center justify-between px-2 pb-1">
                <span className="text-[11px] font-semibold text-gray-400">
                  Blue dots mean practice days.
                </span>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-blue-500 shadow-sm active:scale-95"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="max-h-[252px] space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {visibleSessions.length === 0 && (
              <p className="rounded-2xl bg-gray-50 px-3 py-4 text-center text-xs font-semibold text-gray-400">
                {sessions.length === 0
                  ? "No practice runs saved yet. Finish a practice and it shows up here."
                  : selectedDate
                    ? "No runs on this date. Pick a day with a blue dot, or clear the date."
                    : "No practice runs found."}
              </p>
            )}
            {visibleSessions.map((item) => (
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

            {/* Coaching prompt — your own instruction, sent to the AI coach */}
            <button
              onClick={() => setPromptOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-left active:scale-[0.99]"
            >
              <Settings size={17} className="text-blue-500" />
              <span className="flex-1 text-sm font-bold text-gray-800">Coaching prompt</span>
              <span className="text-xs font-semibold text-gray-400">{customPrompt ? "Custom" : "Default"}</span>
              <ChevronDown size={15} className="text-gray-300 transition-transform" style={{ transform: promptOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {promptOpen && (
              <div className="rounded-2xl bg-gray-50 px-3 py-3">
                <textarea
                  value={customPrompt}
                  onChange={(e) => { setCustomPromptState(e.target.value); setCustomPrompt(e.target.value); }}
                  rows={3}
                  placeholder="e.g. Help me sound more confident and reuse science words. Ask me one tough question when I pause."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-300"
                />
                <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-gray-400">
                  Added to the coach as an extra instruction (still feedback-only — no full speeches or scores). Leave empty for the default.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      <AppTabBar />
    </div>
  );
}
