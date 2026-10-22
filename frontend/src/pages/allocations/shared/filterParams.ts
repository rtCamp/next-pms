import type { FilterCondition } from "@/components/Filter";
import { buildFilterConditions } from "@/utils/filters";
import type { AllocationStatus } from "./types";

/** An option of the "Allocation type" filter (the `allocationType` param holds a list of them). */
export type AllocationTypeValue =
  | AllocationStatus
  | "ai-created"
  | "billable"
  | "non-billable"
  | "no-allocation";

const STATUS_VALUES: AllocationStatus[] = ["Confirmed", "Tentative"];

/** The "Allocation type" options, in React's order; `no-allocation` is Team-only. */
export const ALLOCATION_TYPE_OPTIONS: {
  label: string;
  value: AllocationTypeValue;
}[] = [
  { label: "Confirmed only", value: "Confirmed" },
  { label: "Tentative only", value: "Tentative" },
  { label: "Ai created only", value: "ai-created" },
  { label: "Billable only", value: "billable" },
  { label: "Non-billable only", value: "non-billable" },
  { label: "No allocation only", value: "no-allocation" },
];

/** The Project page's "Allocation type" options: every one but "No allocation". */
export const PROJECT_ALLOCATION_TYPE_OPTIONS = ALLOCATION_TYPE_OPTIONS.filter(
  (option) => option.value !== "no-allocation",
);

/** What an "Allocation type" selection asks for, split into the filter's axes. */
export interface AllocationTypeSelection {
  /** Statuses to keep; empty keeps both. */
  statuses: AllocationStatus[];
  /** `is_billable` values to keep (1 billable, 0 not); empty keeps both. */
  billableValues: (0 | 1)[];
  aiCreatedOnly: boolean;
  /** Adds the employees with no allocation in the window (Team only). */
  includeUnallocated: boolean;
  /**
   * Whether the statuses apply: not when "No allocation" is the only presence option
   * picked, since an unallocated employee has no allocation to carry a status.
   */
  isStatusApplicable: boolean;
}

/**
 * The options of `options` in a parsed `allocationType` list, in order and without
 * repeats.
 */
export function parseAllocationTypes(
  values: unknown[],
  options: readonly { value: AllocationTypeValue }[] = ALLOCATION_TYPE_OPTIONS,
): AllocationTypeValue[] {
  const known = new Set<string>(options.map((option) => option.value));
  return [
    ...new Set(
      values.filter(
        (value): value is AllocationTypeValue =>
          typeof value === "string" && known.has(value),
      ),
    ),
  ];
}

/**
 * Splits an "Allocation type" selection into its axes. Billable, non-billable and no
 * allocation are groups of employees, so picking several unions them: both billable
 * options mean "either kind" (`[1, 0]`), which still leaves out unallocated employees.
 */
export function resolveAllocationTypes(
  values: AllocationTypeValue[],
): AllocationTypeSelection {
  const billable = values.includes("billable");
  const nonBillable = values.includes("non-billable");
  const includeUnallocated = values.includes("no-allocation");
  const aiCreatedOnly = values.includes("ai-created");
  const isStatusApplicable =
    !includeUnallocated || billable || nonBillable || aiCreatedOnly;
  return {
    statuses: isStatusApplicable
      ? STATUS_VALUES.filter((status) => values.includes(status))
      : [],
    billableValues: [
      ...(billable ? [1 as const] : []),
      ...(nonBillable ? [0 as const] : []),
    ],
    aiCreatedOnly,
    includeUnallocated,
    isStatusApplicable,
  };
}

/**
 * Drops the statuses a selection can't apply, so the filter never shows a checked option
 * that does nothing. Returns `values` itself when nothing is dropped.
 */
export function normalizeAllocationTypes(
  values: AllocationTypeValue[],
): AllocationTypeValue[] {
  if (resolveAllocationTypes(values).isStatusApplicable) return values;
  return values.filter(
    (value) => !STATUS_VALUES.includes(value as AllocationStatus),
  );
}

/** The Team endpoint's allocation-type params: lists as JSON, as React sent them. */
export interface TeamAllocationTypeParams {
  allocation_status?: string;
  is_billable?: string;
  is_ai_created?: 1;
  no_allocation: boolean;
}

export function teamAllocationTypeParams(
  values: AllocationTypeValue[],
): TeamAllocationTypeParams {
  const selection = resolveAllocationTypes(values);
  return {
    allocation_status: selection.statuses.length
      ? JSON.stringify(selection.statuses)
      : undefined,
    is_billable: selection.billableValues.length
      ? JSON.stringify(selection.billableValues)
      : undefined,
    is_ai_created: selection.aiCreatedOnly ? 1 : undefined,
    no_allocation: selection.includeUnallocated,
  };
}

/** The Project endpoint's allocation-type params: one status or none, one billable flag or none. */
export interface ProjectAllocationTypeParams {
  allocation_status?: string;
  is_billable?: string;
  is_ai_created?: 1;
}

export function projectAllocationTypeParams(
  values: AllocationTypeValue[],
): ProjectAllocationTypeParams {
  const { statuses, billableValues, aiCreatedOnly } =
    resolveAllocationTypes(values);
  return {
    allocation_status:
      statuses.length === 1 ? JSON.stringify(statuses) : undefined,
    is_billable:
      billableValues.length === 1
        ? JSON.stringify(billableValues[0])
        : undefined,
    is_ai_created: aiCreatedOnly ? 1 : undefined,
  };
}

/** The Filter panel's complete conditions as the endpoints' `filters` JSON, or `undefined`. */
export function compositeFiltersParam(
  conditions: FilterCondition[],
): string | undefined {
  const filters = buildFilterConditions(conditions);
  return filters.length ? JSON.stringify(filters) : undefined;
}

/** A list filter (designation, department) as JSON, de-duplicated and sorted, or `undefined`. */
export function sortedListParam(values: string[]): string | undefined {
  const sorted = [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
  return sorted.length ? JSON.stringify(sorted) : undefined;
}
