import type { BudgetBurnTier } from "./types";

/** `v` as a percentage of `max`, capped at 100; 0 when `max` is 0 or less. */
export function scale(v: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (v / max) * 100));
}

export function budgetBurnTier(percent: number): BudgetBurnTier {
  if (percent > 80) return "over";
  if (percent >= 60) return "moderate";
  return "healthy";
}
