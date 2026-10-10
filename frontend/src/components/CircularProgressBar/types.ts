export type CircularProgressBarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type CircularProgressBarThemeName =
  "black" | "red" | "green" | "blue" | "orange";
export type CircularProgressBarVariant = "solid" | "outline";

/**
 * A colour: a frappe-ui semantic token name such as `"ink-blue-5"` or
 * `"surface-gray-3"` (preferred, follows dark mode), or any CSS colour.
 */
export type CircularProgressBarColor = string;

export interface CircularProgressBarCustomTheme {
  /** Colour of the filled part of the ring. */
  primary: CircularProgressBarColor;
  /** Colour of the remaining part of the ring. */
  secondary: CircularProgressBarColor;
}

export interface CircularProgressBarProps {
  /** Current step; the ring fills `step / totalSteps`. */
  step?: number;
  /** Number of steps to completion. */
  totalSteps?: number;
  /** Show the percentage inside the ring instead of the step number. */
  showPercentage?: boolean;
  /** Named colour theme, or custom `{ primary, secondary }` colours. */
  theme?: CircularProgressBarThemeName | CircularProgressBarCustomTheme;
  /** Ring size. */
  size?: CircularProgressBarSize;
  /** Colour shown once `step >= totalSteps` (token name or CSS colour). */
  themeComplete?: CircularProgressBarColor;
  /** `solid` fills the centre with `themeComplete` when complete; `outline` fills the ring. */
  variant?: CircularProgressBarVariant;
}
