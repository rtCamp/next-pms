import type { ProgressBarSize } from "@/components/ProgressBar";

/** Colour tier from the share of the budget used: above 80% `over`, 60–80% `moderate`, below 60% `healthy`. */
export type BudgetBurnTier = "healthy" | "moderate" | "over";

export interface BudgetBurnBarProps {
  /** Amount used so far, e.g. cost accrued. */
  value: number;
  /** Amount expected on top of `value`, e.g. cost forecasted; drawn after it. */
  secondaryValue?: number;
  /** Total budget the bar is measured against. */
  maxValue?: number;
  /** Target drawn as ticks above and below the bar; also the base for the colour tier when set. */
  markerValue?: number;
  /** Tooltip text for the `value` segment. The `primary-tooltip` slot takes precedence. */
  primaryTooltip?: string;
  /** Tooltip text for the `secondaryValue` segment. The `secondary-tooltip` slot takes precedence. */
  secondaryTooltip?: string;
  /** Tooltip text for the marker. The `marker-tooltip` slot takes precedence. */
  markerTooltip?: string;
  /** Bar height. */
  size?: ProgressBarSize;
  /** Accessible name of the bar. */
  label?: string;
}
