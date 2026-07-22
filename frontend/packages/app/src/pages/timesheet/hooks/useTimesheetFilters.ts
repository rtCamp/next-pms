/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { type ApprovalStatusType } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { pickAllowed } from "@/lib/utils";

const SEARCH_PARAM_KEY = "search";
const APPROVAL_PARAM_KEY = "approval";
const REPORTS_TO_PARAM_KEY = "reportsTo";
const COMPOSITE_FILTERS_PARAM_KEY = "compositeFilters";
const DEFAULT_CLEAR_KEYS_ON_CHANGE: string[] = [];

const APPROVAL_STATUS_PARAM_VALUES = [
  "not-submitted",
  "approved",
  "rejected",
  "approval-pending",
  "partially-approved",
  "partially-rejected",
] as const satisfies readonly ApprovalStatusType[];

type ApprovalStatusParamValue = (typeof APPROVAL_STATUS_PARAM_VALUES)[number];

const parseApprovalStatuses = (
  raw: string | null,
): ApprovalStatusParamValue[] =>
  raw
    ? raw
        .split(",")
        .map((value) => pickAllowed(value, APPROVAL_STATUS_PARAM_VALUES))
        .filter(
          (value): value is ApprovalStatusParamValue => value !== undefined,
        )
    : [];

/**
 * Parses the composite filters from a JSON string in the URL search params.
 */
const parseCompositeFilters = (raw: string | null): FilterCondition[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FilterCondition[]) : [];
  } catch {
    return [];
  }
};

type TimesheetFilterOptions = {
  includeApprovalStatus?: boolean;
  includeReportsTo?: boolean;
  clearKeysOnChange?: string[];
};

type TimesheetFilterState = {
  search: string;
  compositeFilters: FilterCondition[];
  approvalStatus?: ApprovalStatusType[];
  reportsTo?: string;
};

/**
 * Custom hook to manage timesheet filters via URL search parameters.
 * It provides the current filter values and setter functions to update them,
 * which in turn updates the URL search params accordingly.
 */
export function useTimesheetFilters({
  includeApprovalStatus = false,
  includeReportsTo = false,
  clearKeysOnChange = DEFAULT_CLEAR_KEYS_ON_CHANGE,
}: TimesheetFilterOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(SEARCH_PARAM_KEY) ?? "";
  const compositeFilters = useMemo(
    () => parseCompositeFilters(searchParams.get(COMPOSITE_FILTERS_PARAM_KEY)),
    [searchParams],
  );
  const approvalParam = searchParams.get(APPROVAL_PARAM_KEY);
  const approvalStatus = useMemo(
    () =>
      includeApprovalStatus ? parseApprovalStatuses(approvalParam) : undefined,
    [includeApprovalStatus, approvalParam],
  );
  const reportsTo =
    includeReportsTo && searchParams.has(REPORTS_TO_PARAM_KEY)
      ? (searchParams.get(REPORTS_TO_PARAM_KEY) ?? "")
      : undefined;

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          clearKeysOnChange.forEach((key) => next.delete(key));
          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === "") {
              next.delete(key);
              return;
            }

            next.set(key, value);
          });

          return next;
        },
        { replace: true },
      ),
    [clearKeysOnChange, setSearchParams],
  );

  const setSearch = useCallback(
    (value: string) => updateSearchParams({ [SEARCH_PARAM_KEY]: value }),
    [updateSearchParams],
  );

  const setApprovalStatus = useCallback(
    (values: ApprovalStatusType[]) =>
      updateSearchParams({
        [APPROVAL_PARAM_KEY]: values.length ? values.join(",") : undefined,
      }),
    [updateSearchParams],
  );

  const setReportsTo = useCallback(
    (value: string | null) =>
      updateSearchParams({ [REPORTS_TO_PARAM_KEY]: value || undefined }),
    [updateSearchParams],
  );

  const setCompositeFilters = useCallback(
    (value: FilterCondition[]) =>
      updateSearchParams({
        [COMPOSITE_FILTERS_PARAM_KEY]: value.length
          ? JSON.stringify(value)
          : undefined,
      }),
    [updateSearchParams],
  );

  const resetAll = useCallback(
    () =>
      updateSearchParams({
        [SEARCH_PARAM_KEY]: undefined,
        [APPROVAL_PARAM_KEY]: undefined,
        [REPORTS_TO_PARAM_KEY]: undefined,
        [COMPOSITE_FILTERS_PARAM_KEY]: undefined,
      }),
    [updateSearchParams],
  );

  return {
    filters: {
      search,
      compositeFilters,
      approvalStatus,
      reportsTo,
    } satisfies TimesheetFilterState,
    setSearch,
    setApprovalStatus,
    setReportsTo,
    setCompositeFilters,
    resetAll,
  };
}
