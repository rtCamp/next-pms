/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import type { Member } from "@next-pms/design-system/components";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { TeamAllocationResponse } from "./type";
import { mapTeamAllocationToMembers } from "./utils";

type UseAllocationsTeamDataOptions = {
  anchorDate: Date;
  weekCount: number;
  search: string;
  pageLength: number;
};

type UseAllocationsTeamDataResult = {
  members: Member[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
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
  pageLength,
}: UseAllocationsTeamDataOptions): UseAllocationsTeamDataResult {
  const toast = useToasts();

  const requestDate = useMemo(
    () => format(anchorDate, "yyyy-MM-dd"),
    [anchorDate],
  );
  const querySignature = `${requestDate}:${weekCount}:${search}`;

  const baseParams = useMemo(
    () => ({
      date: requestDate,
      max_week: weekCount,
      employee_name: search || null,
      need_hours_summary: false,
    }),
    [requestDate, search, weekCount],
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
          Boolean(payload),
        ),
    [pages],
  );

  const members = useMemo(
    () => payloads.flatMap((payload) => mapTeamAllocationToMembers(payload)),
    [payloads],
  );

  const lastPayload = payloads.at(-1);
  const hasMore = lastPayload ? Boolean(lastPayload.has_more) : false;
  const isLoadingMore = !isLoading && isValidating && size > pages.length;

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
    if (isLoading || isLoadingMore || !hasMore) {
      return;
    }

    void setSize(size + 1);
  }, [hasMore, isLoading, isLoadingMore, setSize, size]);

  return {
    members,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    refresh,
  };
}
