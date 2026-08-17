/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { ProjectTimesheetProject } from "@/components/timesheet-row/projectTimesheetRow";
import { hashString, parseFrappeErrorMsg } from "@/lib/utils";
import { PROJECT_PAGE_LENGTH } from "./constants";
import type {
  ProjectFilterArgs,
  ProjectMemberWeekPayload,
  ProjectWeekProjectsResponse,
} from "./types";
import { applyRealtimeToPages, toProjectGroup } from "./utils";

type UseProjectWeekProjectsOptions = {
  startDate: string;
  filterArgs: ProjectFilterArgs;
  enabled: boolean;
};

type UseProjectWeekProjectsResult = {
  projects: ProjectTimesheetProject[];
  hasMore: boolean;
  isLoadingProjects: boolean;
  isNextPageLoading: boolean;
  loadMore: () => void;
  refreshEmployeeWeek: (payload: ProjectMemberWeekPayload | null) => void;
};

const QUERY_SIGNATURE_PREFIX = "project-week-projects:";

export function useProjectWeekProjects({
  startDate,
  filterArgs,
  enabled,
}: UseProjectWeekProjectsOptions): UseProjectWeekProjectsResult {
  const toast = useToasts();

  const querySignature = useMemo(
    () =>
      `${QUERY_SIGNATURE_PREFIX}${hashString(
        JSON.stringify({ startDate, ...filterArgs }),
      )}`,
    [startDate, filterArgs],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: ProjectWeekProjectsResponse | null,
    ): PaginationKey | null => {
      if (!enabled) {
        return null;
      }
      if (previousPageData?.message && !previousPageData.message.has_more) {
        return null;
      }
      return [querySignature, pageIndex] as const;
    },
    [enabled, querySignature],
  );

  const {
    data: paginatedData,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = usePagination<ProjectWeekProjectsResponse>(
    "next_pms.timesheet.api.project.get_project_timesheet_data",
    getKey,
    {
      start_date: startDate,
      page_length: PROJECT_PAGE_LENGTH,
      ...filterArgs,
    },
    {
      revalidateOnFocus: false,
      revalidateAll: false,
      revalidateFirstPage: false,
      keepPreviousData: true,
      persistSize: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      onError: (err) => {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      },
    },
  );

  const pages = useMemo(() => paginatedData ?? [], [paginatedData]);

  const projects = useMemo(
    () =>
      pages.flatMap((page) =>
        (page.message?.projects ?? []).map(toProjectGroup),
      ),
    [pages],
  );

  const lastPayload = pages.at(-1)?.message;
  const hasMore = lastPayload ? Boolean(lastPayload.has_more) : false;
  const isLoadingProjects = enabled && isLoading;
  const isNextPageLoading =
    !isLoading && isValidating && typeof pages[size - 1] === "undefined";

  const loadMore = useCallback(() => {
    if (isLoading || isNextPageLoading || !hasMore) {
      return;
    }
    void setSize((current) => current + 1);
  }, [hasMore, isLoading, isNextPageLoading, setSize]);

  const hasActiveFilter = Boolean(filterArgs.search || filterArgs.filters);

  /**
   * Refresh a single employee's week across all projects.
   */
  const refreshEmployeeWeek = useCallback(
    (payload: ProjectMemberWeekPayload | null) => {
      if (!paginatedData?.length) return;

      // No payload means the update came in as an invalidation, so the week has to be
      // refetched. An active filter refreshes the entire list for the same reason, to
      // avoid including stale data in the filtered results.
      if (!payload || hasActiveFilter) {
        void mutate();
        return;
      }

      const nextPages = applyRealtimeToPages(paginatedData, payload);
      if (!nextPages) {
        void mutate();
        return;
      }

      void mutate(nextPages, { revalidate: false });
    },
    [hasActiveFilter, mutate, paginatedData],
  );

  return {
    projects,
    hasMore,
    isLoadingProjects,
    isNextPageLoading,
    loadMore,
    refreshEmployeeWeek,
  };
}
