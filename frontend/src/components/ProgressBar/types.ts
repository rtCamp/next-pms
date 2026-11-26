export type ProgressBarSize = "sm" | "md" | "lg";

export interface ProgressBarProps {
  /** Primary value, clamped to `0…maxValue`. */
  value: number;
  /** Optional second value drawn on the same track; the larger of the two sits behind. */
  secondaryValue?: number;
  /** Value the bar is measured against. A value of 0 or less draws an empty bar. */
  maxValue?: number;
  /** Draws a vertical marker at this value; hidden at or outside `0…maxValue`. */
  markerValue?: number;
  /** Bar height: `sm` 4px, `md` 8px, `lg` 12px. */
  size?: ProgressBarSize;
  /** Classes for the primary fill, e.g. `"bg-surface-blue-5"`. Replaces the default grey. */
  indicatorClass?: string;
  /** Classes for the secondary fill. Replaces the default grey. */
  secondaryIndicatorClass?: string;
  /** Classes for the marker. Replaces the default grey. */
  markerClass?: string;
  /** Accessible name of the bar. */
  label?: string;
}
