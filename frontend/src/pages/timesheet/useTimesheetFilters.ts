import { computed } from "vue";
import { useRoute } from "vue-router";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { FilterCondition } from "@/components/Filter";
import {
  APPROVAL_STATUS_PARAMS,
  approvalStatusFromParam,
} from "@/components/Timesheet";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { parseJSONArrayParam, queryString } from "@/utils/query";
import { APPROVAL_FILTER_STATUSES } from "./constants";
import { buildTimesheetQuery } from "./filters";

const FILTER_PARAMS = [
  "search",
  "approval",
  "reportsTo",
  "compositeFilters",
] as const;

export interface TimesheetFilterOptions {
  /** Reads the `approval` param (personal and team pages). */
  approvalStatus?: boolean;
  /** Reads the `reportsTo` param (team page). */
  reportsTo?: boolean;
  /** Weeks per request when no date range is set. */
  weeksPerPage: number;
}

export interface TimesheetFilters {
  search: string;
  compositeFilters: FilterCondition[];
  /** Selected approval statuses; `undefined` when the page has no such filter. */
  approvalStatus?: ApprovalStatusValue[];
  /** Employee whose reports are shown; `undefined` when the param is absent. */
  reportsTo?: string;
}

function parseApprovalStatuses(param: string): ApprovalStatusValue[] {
  return param
    .split(",")
    .map(approvalStatusFromParam)
    .filter(
      (status): status is ApprovalStatusValue =>
        status !== undefined && APPROVAL_FILTER_STATUSES.includes(status),
    );
}

/**
 * A timesheet page's filters, kept in the route query (`replace`) under the React
 * page's keys and formats: `search`, `approval` (comma-separated kebab-case statuses),
 * `reportsTo` and `compositeFilters` (JSON Filter conditions), so old links work.
 */
export function useTimesheetFilters(options: TimesheetFilterOptions) {
  const route = useRoute();
  const patchQuery = useQueryPatch();

  const filters = computed<TimesheetFilters>(() => ({
    search: queryString(route.query.search),
    compositeFilters: parseJSONArrayParam<FilterCondition>(
      queryString(route.query.compositeFilters),
    ),
    approvalStatus: options.approvalStatus
      ? parseApprovalStatuses(queryString(route.query.approval))
      : undefined,
    reportsTo:
      options.reportsTo && route.query.reportsTo !== undefined
        ? queryString(route.query.reportsTo)
        : undefined,
  }));

  /** The endpoints' week range and `filters`, from the complete conditions. */
  const query = computed(() =>
    buildTimesheetQuery(filters.value.compositeFilters, options.weeksPerPage),
  );

  /** Statuses to send; every status selected is the same as none. */
  const requestApprovalStatus = computed<ApprovalStatusValue[]>(() => {
    const selected = filters.value.approvalStatus ?? [];
    return selected.length === APPROVAL_FILTER_STATUSES.length ? [] : selected;
  });

  function setSearch(search: string) {
    patchQuery({ search });
  }

  function setApprovalStatus(statuses: ApprovalStatusValue[]) {
    patchQuery({
      approval: statuses
        .map((status) => APPROVAL_STATUS_PARAMS[status])
        .join(","),
    });
  }

  function setReportsTo(employeeId: string | null) {
    patchQuery({ reportsTo: employeeId });
  }

  function setCompositeFilters(conditions: FilterCondition[]) {
    patchQuery({
      compositeFilters: conditions.length ? JSON.stringify(conditions) : "",
    });
  }

  function resetFilters() {
    patchQuery(Object.fromEntries(FILTER_PARAMS.map((key) => [key, ""])));
  }

  return {
    filters,
    query,
    requestApprovalStatus,
    setSearch,
    setApprovalStatus,
    setReportsTo,
    setCompositeFilters,
    resetFilters,
  };
}
