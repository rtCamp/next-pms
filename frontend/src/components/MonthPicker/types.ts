import type { PopoverAlign, PopoverSide } from "frappe-ui";

export interface MonthPickerProps {
  /** Selected month in `MMMM YYYY` format, e.g. `"January 2026"` (v-model). */
  modelValue?: string;
  /** Trigger text when no month is selected. */
  placeholder?: string;
  /** frappe-ui class icon at the trigger's right edge. */
  icon?: string;
  /** Side of the trigger the panel opens on. */
  side?: PopoverSide;
  /** Alignment of the panel along that side. */
  align?: PopoverAlign;
}
