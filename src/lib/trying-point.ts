// "Trying Point" — one private upgrade at a time. From the design walkthrough
// (Page 6): instead of scores, give the student ONE visible thing to try, which
// lowers anxiety and fits the "coach, not evaluator" stance.
//
// Shared source so the same trying point shows across the journey:
// Home (this week's focus) → Practice → Takeaway (the next-run "one move" is
// framed as the next trying point) → My (the tracked list).

export const TRYING_POINTS = [
  "Add one real example after your first claim",
  "Reuse two saved science words",
  "Hold your opening thought for 20 seconds",
];

const NEXT_KEY = "speakspark.nextTryingPoint";

// Closed loop: the Takeaway saves its "one move" as the next trying point,
// and Home shows exactly that until the next run updates it.
export function setNextTryingPoint(value: string): void {
  try {
    if (value && value.trim()) window.localStorage.setItem(NEXT_KEY, value.trim());
  } catch {
    /* ignore */
  }
}

export function getNextTryingPoint(): string {
  try {
    return (window.localStorage.getItem(NEXT_KEY) || "").trim();
  } catch {
    return "";
  }
}

// The single focus to surface on Home: the one move from the last practice if
// there is one; otherwise a stable weekly default from the list.
export function currentTryingPoint(): string {
  const fromLastRun = getNextTryingPoint();
  if (fromLastRun) return fromLastRun;
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return TRYING_POINTS[weekIndex % TRYING_POINTS.length];
}
