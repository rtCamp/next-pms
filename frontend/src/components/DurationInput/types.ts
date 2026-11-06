export type DurationInputSnapMode = "step" | "smooth";
export type DurationInputSize = "sm" | "md";
export type DurationInputVariant = "subtle" | "outline";

export interface DurationInputProps {
  /** Duration in decimal hours, e.g. `1.5` for 1h 30m (v-model). */
  modelValue?: number;
  /** Id of the text field, for an external `<label for>`. Generated when omitted. */
  id?: string;
  /** Label above the control; also shows the hours left/over text. Omit to hide both. */
  label?: string;
  /** Appends a required asterisk to the label. */
  required?: boolean;
  /** Label shown inside the slider track. */
  inlineLabel?: string;
  /** Slider maximum, in hours. */
  maxDuration?: number;
  /** Hours remaining; the header shows `hoursLeft - value` as "left" or "over". */
  hoursLeft?: number;
  /** `step` moves the slider in 30-minute steps; `smooth` drags freely and snaps on release. */
  snap?: DurationInputSnapMode;
  /** Height of the control. */
  size?: DurationInputSize;
  /** Visual style of the control. */
  variant?: DurationInputVariant;
  /** Disables the slider and the text field. */
  disabled?: boolean;
  /** Shows a spinner before the text field. */
  loading?: boolean;
  /** Error styling; a string is also shown as a message below the control. */
  error?: boolean | string;
  /** Lets a typed value exceed `maxDuration`; the slider stays capped at the maximum. */
  allowOverflow?: boolean;
}
