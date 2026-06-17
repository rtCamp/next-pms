/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import type { Member } from "@next-pms/design-system/components";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import useApproverOptions from "@/hooks/useApproverOptions";
import { hashString, parseFrappeErrorMsg } from "@/lib/utils";
import { buildAllocationQueryFilters } from "../utils";
import type { TeamAllocationResponse } from "./type";
import { mapTeamAllocationToMembers } from "./utils";

type UseAllocationsTeamDataOptions = {
  anchorDate: Date;
  weekCount: number;
  search: string;
  designation: string[];
  allocationsType: string[];
  compositeFilters: FilterCondition[];
  pageLength: number;
};

type UseAllocationsTeamDataResult = {
  members: Member[];
  hasMore: boolean;
  isQueryLoading: boolean;
  isNextPageLoading: boolean;
  loadMore: () => void;
  refresh: (employeeIds?: string[]) => Promise<void>;
};

type TeamAllocationCallResponse = {
  message?: TeamAllocationResponse;
};

export function useAllocationsTeamData({
  anchorDate,
  weekCount,
  search,
  designation,
  allocationsType,
  compositeFilters,
  pageLength,
}: UseAllocationsTeamDataOptions): UseAllocationsTeamDataResult {
  const toast = useToasts();

  const defaultRequestDate = useMemo(
    () => format(anchorDate, "yyyy-MM-dd"),
    [anchorDate],
  );
  const { requestDate, maxWeek, filters } = useMemo(
    () =>
      buildAllocationQueryFilters({
        compositeFilters,
        defaultRequestDate,
        defaultWeekCount: weekCount,
      }),
    [compositeFilters, defaultRequestDate, weekCount],
  );
  const designationParam = useMemo(() => {
    const normalizedDesignation = Array.from(new Set(designation)).sort(
      (left, right) => left.localeCompare(right),
    );

    return normalizedDesignation.length
      ? JSON.stringify(normalizedDesignation)
      : null;
  }, [designation]);
  const filtersParam = useMemo(
    () => (filters.length > 0 ? JSON.stringify(filters) : null),
    [filters],
  );
  const hasConfirmed = allocationsType.includes("Confirmed");
  const hasTentative = allocationsType.includes("Tentative");
  const hasBillable = allocationsType.includes("billable");
  const hasNonBillable = allocationsType.includes("non-billable");
  const allocationStatusParam =
    hasConfirmed || hasTentative
      ? JSON.stringify([
          ...(hasConfirmed ? ["Confirmed"] : []),
          ...(hasTentative ? ["Tentative"] : []),
        ])
      : null;
  const isBillableParam =
    hasBillable === hasNonBillable
      ? null
      : JSON.stringify(hasBillable ? [1] : [0]);
  const querySignature = useMemo(
    () =>
      hashString(
        [
          "team-allocations",
          requestDate,
          String(maxWeek),
          search,
          designationParam ?? "",
          allocationStatusParam ?? "",
          isBillableParam ?? "",
          filtersParam ?? "",
        ].join(":"),
      ),
    [
      allocationStatusParam,
      designationParam,
      filtersParam,
      isBillableParam,
      maxWeek,
      requestDate,
      search,
    ],
  );

  const baseParams = useMemo(
    () => ({
      date: requestDate,
      max_week: maxWeek,
      employee_name: search || null,
      designation: designationParam,
      allocation_status: allocationStatusParam,
      is_billable: isBillableParam,
      filters: filtersParam,
      need_hours_summary: false,
    }),
    [
      allocationStatusParam,
      designationParam,
      filtersParam,
      isBillableParam,
      maxWeek,
      requestDate,
      search,
    ],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: TeamAllocationCallResponse | null,
    ): PaginationKey | null => {
      if (previousPageData?.message && !previousPageData.message.has_more) {
        return null;
      }

      return [querySignature, pageIndex] as const;
    },
    [querySignature],
  );

  const {
    data: paginatedData,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = usePagination<TeamAllocationCallResponse>(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
    getKey,
    {
      ...baseParams,
      page_length: pageLength,
    },
    {
      revalidateOnFocus: false,
      revalidateAll: false,
      revalidateFirstPage: false,
      keepPreviousData: true,
      persistSize: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      onError: (error) => {
        toast.error(parseFrappeErrorMsg(error as FrappeError));
      },
    },
  );

  const pages = useMemo(() => paginatedData ?? [], [paginatedData]);

  const payloads = useMemo(
    () =>
      pages
        .map((page) => page.message)
        .filter((payload): payload is TeamAllocationResponse =>
          Boolean(payload && Array.isArray(payload.employees)),
        ),
    [pages],
  );

  const approvers = useApproverOptions();

  const managerNameMap = useMemo(
    () => new Map(approvers.map((a) => [a.value, a.label])),
    [approvers],
  );

  const members = useMemo(
    () =>
      payloads.flatMap((payload) =>
        mapTeamAllocationToMembers(payload, managerNameMap),
      ),
    [payloads, managerNameMap],
  );

  const lastPayload = payloads.at(-1);
  const hasMore = lastPayload ? Boolean(lastPayload.has_more) : false;
  const isQueryLoading = isLoading;
  const isNextPageLoading =
    !isLoading && isValidating && typeof pages[size - 1] === "undefined";

  const refresh = useCallback<UseAllocationsTeamDataResult["refresh"]>(
    async (employeeIds) => {
      try {
        // Fall back to the default SWR refresh when no page targeting is possible.
        if (!employeeIds?.length || !paginatedData?.length) {
          await mutate();
          return;
        }

        // Revalidate only loaded pages that contain the updated employees.
        const targetEmployeeIds = new Set(employeeIds);
        const pagesToRevalidate = new Set<number>();

        paginatedData.forEach((page, index) => {
          const employees = page.message?.employees ?? [];

          if (
            employees.some((employee) => targetEmployeeIds.has(employee.name))
          ) {
            pagesToRevalidate.add(index);
          }
        });

        if (!pagesToRevalidate.size) {
          // Nothing visible matches these employees.
          return;
        }

        await mutate(paginatedData, {
          revalidate: (_pageData, pageKey) => {
            return (
              Array.isArray(pageKey) &&
              typeof pageKey[1] === "number" &&
              pagesToRevalidate.has(pageKey[1])
            );
          },
        });
      } catch {
        // SWR onError already handles the visible failure state.
        return;
      }
    },
    [mutate, paginatedData],
  );

  const loadMore = useCallback(() => {
    if (isQueryLoading || isNextPageLoading || !hasMore) {
      return;
    }

    void setSize((current) => current + 1);
  }, [hasMore, isNextPageLoading, isQueryLoading, setSize]);

  return {
    members,
    hasMore,
    isQueryLoading,
    isNextPageLoading,
    loadMore,
    refresh,
  };
}
