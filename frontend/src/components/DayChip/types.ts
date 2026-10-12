export type DayChipState =
  "default" | "active" | "selected" | "disabled" | "skeleton";

export interface DayChipProps {
  /** Short weekday name, e.g. `"Mon"`. */
  dayLabel: string;
  /** Day of the month. */
  dayNumber: number;
  /** Short month name shown in a tag under the chip, e.g. `"Oct"`. */
  monthLabel?: string;
  /** Shows `monthLabel`; set it on the first day of a month. */
  isMonthBoundary?: boolean;
  /** Visual state. Hover and focus come from CSS. */
  state?: DayChipState;
  /** Ignores clicks. `disabled` and `skeleton` states are disabled too. */
  disabled?: boolean;
  /** Tooltip shown on hover, e.g. why the day is locked. */
  tooltip?: string;
}
