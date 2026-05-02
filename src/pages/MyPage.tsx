import { CalendarDays, ChevronRight, ClipboardList, Settings, ShieldCheck, Sparkles, TrendingUp, UserRound } from "lucide-react";
import AppTabBar from "@/components/AppTabBar";

const ability = [
  { label: "Flow", value: 64, change: "+12", color: "#58A9FF" },
  { label: "Words", value: 58, change: "+9", color: "#7ED957" },
  { label: "Sentences", value: 46, change: "+6", color: "#FFC947" },
  { label: "Story", value: 71, change: "+15", color: "#FF7A5C" },
];

const history = [
  { title: "Renewable energy", time: "Today", gain: "Added one example" },
  { title: "AI in healthcare", time: "Yesterday", gain: "Used 3 stronger words" },
  { title: "Climate change", time: "May 1", gain: "Spoke 22s longer" },
];

const tryingPoints = [
  "Add one real example after your first claim",
  "Reuse two saved science words",
  "Hold your opening thought for 20 seconds",
];

export default function MyPage() {
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
              <p className="mt-0.5 text-sm font-semibold text-gray-400">Science speaking profile</p>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
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
            {tryingPoints.map((point, index) => (
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
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Ability portrait</p>
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
            {history.map((item) => (
              <button key={`${item.title}-${item.time}`} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500">
                  <ClipboardList size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-gray-900">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-400">{item.time} · {item.gain}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">User management</p>
          <div className="space-y-2">
            {[
              { icon: ShieldCheck, label: "Coach mode", value: "Gentle prompts" },
              { icon: Sparkles, label: "Saved phrase bank", value: "12 phrases" },
              { icon: Settings, label: "Prompt settings", value: "Science presentation" },
            ].map(({ icon: Icon, label, value }) => (
              <button key={label} className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 text-left">
                <Icon size={17} className="text-blue-500" />
                <span className="flex-1 text-sm font-bold text-gray-800">{label}</span>
                <span className="text-xs font-semibold text-gray-400">{value}</span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            ))}
          </div>
        </section>
      </div>
      <AppTabBar />
    </div>
  );
}
