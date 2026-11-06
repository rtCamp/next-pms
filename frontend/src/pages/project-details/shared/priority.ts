/** The Low / Medium / High scale of a risk level or a growth initiative's client priority. */
export const PRIORITY_LEVELS = ["Low", "Medium", "High"] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export function isPriorityLevel(value: unknown): value is PriorityLevel {
  return PRIORITY_LEVELS.includes(value as PriorityLevel);
}

/** The ink of each level's pill and bars. */
export const PRIORITY_INK: Record<PriorityLevel, string> = {
  Low: "text-ink-green-7",
  Medium: "text-ink-amber-7",
  High: "text-ink-red-6",
};

/** The tint of each level's pill. */
export const PRIORITY_SURFACE: Record<PriorityLevel, string> = {
  Low: "bg-surface-green-2",
  Medium: "bg-surface-amber-2",
  High: "bg-surface-red-2",
};

/** How many of the three bars a level fills; all three for a level outside the scale. */
export function priorityBars(level: string): number {
  return isPriorityLevel(level)
    ? PRIORITY_LEVELS.indexOf(level) + 1
    : PRIORITY_LEVELS.length;
}
