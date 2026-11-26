import type { PopoverAlign, PopoverSide } from "frappe-ui";

/** One option in the field, operator or value list. */
export interface FilterSelectOption {
  /** Text shown in the list and the input. */
  label: string;
  /** Value stored on the condition. */
  value: string;
  /** frappe-ui class icon shown before the label, e.g. `"lucide-user"`. */
  icon?: string;
  /** Whether the option can't be picked. */
  disabled?: boolean;
}

/** A labelled group of options. */
export interface FilterGroupedOption {
  /** Group heading. */
  group: string;
  /** Options in the group. */
  options: FilterSelectOption[];
}

export type FilterOptionType = FilterSelectOption | FilterGroupedOption;

/** Operator values used by the default operator lists. */
export type FilterOperator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "between"
  | "is_empty"
  | "is_not_empty";

/** An operator a field offers. */
export interface FilterOperatorOption {
  /** Text shown in the operator list. */
  label: string;
  /** Value stored on the condition's `operator`. */
  value: FilterOperator | string;
  /** Hides the value input, for operators such as `is_empty`. */
  hideValue?: boolean;
}

/** Lookup configuration for a `type: "link"` field. */
export interface FilterLinkConfig {
  /** Doctype the linked value comes from. */
  doctype: string;
  /** Field on the doctype shown as the option label. */
  labelField?: string;
  /** Field on the doctype stored as the condition value. */
  valueField?: string;
  /** Server-side filters applied to the lookup. */
  filters?: Array<Array<unknown>>;
  /** Whitelisted method used for the lookup instead of the doctype list. */
  customMethod?: {
    /** Whitelisted method path. */
    method: string;
    /** Arguments passed to the method. */
    args?: Record<string, unknown>;
  };
}

/** A field the user can filter on. */
export interface FilterField {
  /** Category copied onto conditions for this field, for the caller's own grouping. */
  fieldCategory?: string;
  /** Unique field name, stored on the condition's `field`. */
  name: string;
  /** Text shown in the field list. */
  label: string;
  /** Decides the default operators and the value input. Default: `"string"`. */
  type?:
    | "string"
    | "number"
    | "date"
    | "daterange"
    | "select"
    | "multiselect"
    | "link";
  /** Operators offered for this field, replacing the defaults for its type. */
  operators?: FilterOperatorOption[];
  /** Value options; when set, the value input is a list instead of free text. */
  options?: FilterOptionType[];
  /** Lookup configuration for `type: "link"` fields. */
  link?: FilterLinkConfig;
  /** frappe-ui class icon shown before the field label, e.g. `"lucide-user"`. */
  icon?: string;
}

/** Props of the `#link-value` slot, which renders the value input of `type: "link"` fields. */
export interface FilterLinkValueRenderProps {
  /** The condition's field. */
  field: FilterField;
  /** Current value (the linked document name). */
  value: string | null;
  /** Label shown for the current value. */
  displayLabel?: string;
  /** Sets the condition's value and, optionally, the label shown for it. */
  setValue: (value: string | null, displayLabel?: string | null) => void;
  /** Whether the input should be disabled (no operator picked yet). */
  disabled: boolean;
}

/** One filter row: field, operator and value. */
export interface FilterCondition {
  /** Unique id of the condition. */
  id: string;
  /** Name of the filtered field. */
  field: string;
  /** The field's `fieldCategory`, copied when the field is picked. */
  fieldCategory?: string;
  /** Operator value; `""` until one is picked. */
  operator: string;
  /** Value(s) to filter by; `null` until one is entered. A date range is `[from, to]`. */
  value?: string | string[] | number | null;
  /** Label shown for a link value. */
  displayLabel?: string;
}

export interface FilterProps {
  /** Fields the user can filter on. */
  fields: FilterField[];
  /** Filter conditions (v-model). */
  modelValue?: FilterCondition[];
  /** Whether the panel is open (v-model:open). */
  open?: boolean;
  /** Opens the panel on mount. */
  defaultOpen?: boolean;
  /** Most conditions the user can add. */
  maxFilters?: number;
  /** Shows the active-filter count on the trigger. */
  showCount?: boolean;
  /** Side of the trigger the panel opens on. */
  side?: PopoverSide;
  /** Alignment of the panel along that side. */
  align?: PopoverAlign;
  /** Extra classes for the trigger button; `class` goes on the wrapper. */
  triggerClass?: string;
  /**
   * Filters managed outside this component (e.g. a search box). Added to the count, so
   * "Clear all" shows even when `modelValue` is empty.
   */
  externalFilterCount?: number;
}

/** Props of the internal FilterRow. */
export interface FilterRowProps {
  /** The condition the row edits. */
  filter: FilterCondition;
  /** Fields the user can filter on. */
  fields: FilterField[];
  /** Whether this is the first row ("Where" instead of "And"). */
  isFirst?: boolean;
}
