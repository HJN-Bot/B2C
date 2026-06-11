import { useLayoutEffect, useState, type RefObject } from "react";

const KEY = "speakspark.practiceOnboarded";

export interface CoachStep {
  ref: RefObject<HTMLElement>;
  title: string;
  body: string;
}

export function hasOnboardedPractice(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true; // storage blocked → don't nag
  }
}

// Anchored coachmarks: dim everything, spotlight the real panel, explain it.
export default function PracticeOnboarding({ steps, onDone }: { steps: CoachStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const last = i === steps.length - 1;
  const step = steps[i];

  useLayoutEffect(() => {
    const measure = () => setRect(step?.ref.current?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    onDone();
  };
  const next = () => (last ? finish() : setI((n) => n + 1));

  const pad = 8;
  const hole = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Put the tooltip below the target, or above if it's low on screen.
  const below = !rect || rect.bottom + 200 < window.innerHeight;
  const tooltipStyle = rect
    ? below
      ? { top: rect.bottom + 14 }
      : { bottom: window.innerHeight - rect.top + 14 }
    : { top: "50%" as const, transform: "translateY(-50%)" };

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Spotlight: a transparent hole over the target, everything else dimmed. */}
      {hole ? (
        <div
          className="absolute rounded-2xl"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.62)",
            outline: "2px solid rgba(126,217,87,0.9)",
            transition: "all 0.25s ease",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "rgba(15,23,42,0.62)" }} />
      )}

      {/* Tooltip */}
      <div
        className="absolute left-1/2 w-[320px] max-w-[88vw] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-xl"
        style={tooltipStyle}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">
            Quick tour {i + 1}/{steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <span key={idx} className="h-1.5 w-1.5 rounded-full" style={{ background: idx <= i ? "#58A9FF" : "#E5E7EB" }} />
            ))}
          </div>
        </div>
        <h3 className="text-base font-black text-gray-900">{step.title}</h3>
        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-gray-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={finish} className="text-sm font-bold text-gray-400 active:scale-95">Skip</button>
          <button
            onClick={next}
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
