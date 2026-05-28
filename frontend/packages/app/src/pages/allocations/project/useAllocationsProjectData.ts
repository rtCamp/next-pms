/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import type { ProjectGroup } from "@next-pms/design-system/components";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import useApproverOptions from "@/hooks/useApproverOptions";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { ProjectAllocationResponse } from "./type";
import { mapProjectAllocationToProjects } from "./utils";

type UseAllocationsProjectDataOptions = {
  anchorDate: Date;
  weekCount: number;
  search: string;
  pageLength: number;
};

type UseAllocationsProjectDataResult = {
  projects: ProjectGroup[];
  hasMore: boolean;
  isQueryLoading: boolean;
  isNextPageLoading: boolean;
  loadMore: () => void;
  refresh: (projectIds?: string[]) => Promise<void>;
};

type ProjectAllocationCallResponse = {
  message?: ProjectAllocationResponse;
};

const KEY_PREFIX = "project-allocations";

export function useAllocationsProjectData({
  anchorDate,
  weekCount,
  search,
  pageLength,
}: UseAllocationsProjectDataOptions): UseAllocationsProjectDataResult {
  const toast = useToasts();

  const requestDate = useMemo(
    () => format(anchorDate, "yyyy-MM-dd"),
    [anchorDate],
  );
  const querySignature = `${KEY_PREFIX}:${requestDate}:${weekCount}:${search}`;

  const baseParams = useMemo(
    () => ({
      date: requestDate,
      max_week: weekCount,
      project_name: search || null,
    }),
    [requestDate, search, weekCount],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ProjectAllocationCallResponse | null,
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
  } = usePagination<ProjectAllocationCallResponse>(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data",
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
        .filter((payload): payload is ProjectAllocationResponse =>
          Boolean(payload && Array.isArray(payload.data)),
        ),
    [pages],
  );

  const approvers = useApproverOptions();

  const managerNameMap = useMemo(
    () =>
      new Map(approvers.map((approver) => [approver.value, approver.label])),
    [approvers],
  );

  const projects = useMemo(
    () =>
      payloads.flatMap((payload) =>
        mapProjectAllocationToProjects(payload, managerNameMap),
      ),
    [payloads, managerNameMap],
  );

  const lastPayload = payloads.at(-1);
  const hasMore = lastPayload ? Boolean(lastPayload.has_more) : false;
  const isQueryLoading = isLoading;
  const isNextPageLoading =
    !isLoading && isValidating && typeof pages[size - 1] === "undefined";

  const refresh = useCallback<UseAllocationsProjectDataResult["refresh"]>(
    async (projectIds) => {
      try {
        // Fall back to the default SWR refresh when no page targeting is possible.
        if (!projectIds?.length || !paginatedData?.length) {
          await mutate();
          return;
        }

        // Revalidate only loaded pages that contain the updated projects.
        const targetProjectIds = new Set(projectIds);
        const pagesToRevalidate = new Set<number>();

        paginatedData.forEach((page, index) => {
          const projects = page.message?.data ?? [];

          if (projects.some((project) => targetProjectIds.has(project.name))) {
            pagesToRevalidate.add(index);
          }
        });

        if (!pagesToRevalidate.size) {
          // Nothing visible matches these projects.
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
    projects,
    hasMore,
    isQueryLoading,
    isNextPageLoading,
    loadMore,
    refresh,
  };
}
