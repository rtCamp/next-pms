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

const APPROVAL_STATUS_PARAM_VALUES = [
  "not-submitted",
  "approved",
  "rejected",
  "approval-pending",
  "partially-approved",
  "partially-rejected",
] as const satisfies readonly ApprovalStatusType[];

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
  approvalStatus?: ApprovalStatusType;
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
  clearKeysOnChange = [],
}: TimesheetFilterOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(SEARCH_PARAM_KEY) ?? "";
  const compositeFilters = useMemo(
    () => parseCompositeFilters(searchParams.get(COMPOSITE_FILTERS_PARAM_KEY)),
    [searchParams],
  );
  const approvalStatus = includeApprovalStatus
    ? pickAllowed(
        searchParams.get(APPROVAL_PARAM_KEY),
        APPROVAL_STATUS_PARAM_VALUES,
      )
    : undefined;
  const reportsTo =
    includeReportsTo && searchParams.get(REPORTS_TO_PARAM_KEY)
      ? (searchParams.get(REPORTS_TO_PARAM_KEY) ?? undefined)
      : undefined;

  const setParamValues = useCallback(
    (updates: Record<string, string | undefined>) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          for (const key of clearKeysOnChange) {
            next.delete(key);
          }

          for (const [key, value] of Object.entries(updates)) {
            if (value) {
              next.set(key, value);
            } else {
              next.delete(key);
            }
          }

          return next;
        },
        { replace: true },
      ),
    [clearKeysOnChange, setSearchParams],
  );

  const setSearch = useCallback(
    (value: string) => setParamValues({ [SEARCH_PARAM_KEY]: value }),
    [setParamValues],
  );

  const setApprovalStatus = useCallback(
    (value?: ApprovalStatusType | null) =>
      setParamValues({
        [APPROVAL_PARAM_KEY]: value && value !== "none" ? value : undefined,
      }),
    [setParamValues],
  );

  const setReportsTo = useCallback(
    (value: string | null) =>
      setParamValues({ [REPORTS_TO_PARAM_KEY]: value || undefined }),
    [setParamValues],
  );

  const setCompositeFilters = useCallback(
    (value: FilterCondition[]) =>
      setParamValues({
        [COMPOSITE_FILTERS_PARAM_KEY]: value.length
          ? JSON.stringify(value)
          : undefined,
      }),
    [setParamValues],
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
  };
}
