import type { PopoverAlign, PopoverSide } from "frappe-ui";

/** A column the selector can show, add, remove, reorder or pin. */
export interface SelectorColumn {
  /** Text shown in the selector row and in the Add Column search. */
  label: string;
  /** Stable identifier, used for keys and de-duplication. */
  value: string;
  /** Keeps the column in the pinned group at the top. Only used when `pinnable` is set. */
  pinned?: boolean;
}

/** Every user-facing string, overridable for i18n through the `labels` prop. */
export interface ColumnSelectorLabels {
  /** Trigger button text and its `aria-label`. */
  trigger: string;
  /** Footer action that opens the Add Column search. */
  addColumn: string;
  /** Placeholder of the Add Column search input. */
  search: string;
  /** Footer action that emits `reset`. */
  resetToDefault: string;
  /** Prefix of each remove button's `aria-label`, followed by the column label. */
  remove: string;
  /** Prefix of each drag handle's `aria-label`, followed by the column label. */
  reorder: string;
  /** Screen-reader hint on each drag handle explaining the keyboard controls. */
  reorderHint: string;
  /** Pin toggle tooltip and `aria-label` prefix for an unpinned column. */
  pin: string;
  /** Pin toggle tooltip and `aria-label` prefix for a pinned column. */
  unpin: string;
  /** Pin toggle tooltip once `maxPinned` is reached. */
  pinLimit: string;
}

export interface ColumnSelectorProps {
  /** Active columns in display order (v-model). Every add, remove, reorder and pin emits the full next array. */
  modelValue: SelectorColumn[];
  /** Every column the user may add. Entries already in `modelValue` are hidden from the Add Column search. */
  availableColumns: SelectorColumn[];
  /** Show a drag handle on each row; reorder by dragging it, or focus it and use Space and the arrow keys. */
  reorderable?: boolean;
  /** Show a pin toggle on each row. Pinned columns are listed first and reorder only within their group. */
  pinnable?: boolean;
  /** Disables pinning more columns once this many are pinned. Unlimited when omitted. */
  maxPinned?: number;
  /** Remove buttons are hidden once the column count reaches this number. */
  minColumns?: number;
  /** Show the "Reset to Default" action, which emits `reset`. Restoring the columns is the parent's job. */
  resettable?: boolean;
  /** Render the trigger as an icon-only button; the label stays as its `aria-label`. */
  hideLabel?: boolean;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Partial overrides merged over the English defaults. */
  labels?: Partial<ColumnSelectorLabels>;
  /** Side of the trigger the panel opens on. */
  side?: PopoverSide;
  /** Alignment of the panel along that side. */
  align?: PopoverAlign;
}
