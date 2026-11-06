export type SortOrder = "asc" | "desc";

export interface SortField {
  /** Field name the sort applies to, e.g. `"project_name"`. */
  field: string;
  /** Text shown in the list and on the trigger when this field is sorted. */
  label: string;
  /** Shows the field but ignores clicks on it. */
  disabled?: boolean;
  /** Tooltip shown on hover, e.g. why the field is disabled. */
  tooltipText?: string;
}

export interface SortState {
  /** Sorted field. */
  field: string;
  /** Sort direction. */
  order: SortOrder;
}

export interface SortSelectorProps {
  /** Current sort, or `null` for none (v-model). */
  modelValue?: SortState | null;
  /** Fields the user can sort by. */
  fields: SortField[];
}
