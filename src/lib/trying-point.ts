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

// The single focus to surface outside the My list (e.g. on Home). Stable within
// a week so it feels like "this week's" upgrade rather than random each load.
export function currentTryingPoint(): string {
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return TRYING_POINTS[weekIndex % TRYING_POINTS.length];
}
