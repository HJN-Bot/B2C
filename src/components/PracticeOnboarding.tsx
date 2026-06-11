import { useState } from "react";

const KEY = "speakspark.practiceOnboarded";

const STEPS = [
  {
    title: "Your KTV scores",
    body: "These four move as you keep speaking, use strong phrases, and complete ideas. They're private practice signals — not a grade.",
  },
  {
    title: "Your cat coach",
    body: "It follows your idea while you talk. Pause for a couple of seconds and it pops one short question or tip, based on what you just said.",
  },
  {
    title: "Your transcript",
    body: "Your words scroll here with the line you're saying kept in the middle. Just keep talking — it never gets in your way.",
  },
  {
    title: "That's it",
    body: "Tap Start and speak. End anytime — your takeaway is waiting right after.",
  },
];

export function hasOnboardedPractice(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true; // if storage is blocked, don't nag
  }
}

export default function PracticeOnboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">
            Quick tour {i + 1}/{STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: idx <= i ? "#58A9FF" : "#E5E7EB" }}
              />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-black text-gray-900">{step.title}</h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">{step.body}</p>
        <div className="mt-5 flex items-center justify-between">
          <button onClick={finish} className="text-sm font-bold text-gray-400 active:scale-95">
            Skip
          </button>
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="rounded-xl px-5 py-2 text-sm font-black text-white shadow-md active:scale-95"
            style={{ background: "linear-gradient(135deg,#58A9FF,#7ED957)" }}
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
