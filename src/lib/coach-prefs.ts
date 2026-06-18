// User-editable coaching preference (local-only for now; a real per-user
// store needs Supabase + auth, which the app doesn't have yet).
// The custom prompt is appended to the AI coach prompts as an extra
// instruction, still bounded by the coach-mode rules.

const KEY = "speakspark.customPrompt";

export function getCustomPrompt(): string {
  try {
    return (window.localStorage.getItem(KEY) || "").trim();
  } catch {
    return "";
  }
}

export function setCustomPrompt(value: string): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* ignore */
  }
}
