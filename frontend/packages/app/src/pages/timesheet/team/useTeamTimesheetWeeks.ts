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
import { hashString, parseFrappeErrorMsg } from "@/lib/utils";
import { formatTimesheetWeekLabel } from "../utils";
import type {
  TeamFilterArgs,
  TeamWeeksResponse,
  TeamWeekSummary,
} from "./types";

type UseTeamTimesheetWeeksOptions = {
  date: string;
  maxWeek: number;
  filterArgs: TeamFilterArgs;
};

type UseTeamTimesheetWeeksResult = {
  weeks: TeamWeekSummary[];
  hasMoreWeeks: boolean;
  isLoadingWeeks: boolean;
  isNextPageLoading: boolean;
  loadMoreWeeks: () => void;
  refreshWeeks: () => Promise<unknown>;
  error: FrappeError | undefined;
};

type WeekPageParams = { date: string };

const QUERY_SIGNATURE_PREFIX = "team-timesheet-weeks:";

export function useTeamTimesheetWeeks({
  date,
  maxWeek,
  filterArgs,
}: UseTeamTimesheetWeeksOptions): UseTeamTimesheetWeeksResult {
  const toast = useToasts();

  const querySignature = useMemo(
    () =>
      `${QUERY_SIGNATURE_PREFIX}${hashString(
        JSON.stringify({ date, maxWeek, ...filterArgs }),
      )}`,
    [date, maxWeek, filterArgs],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: TeamWeeksResponse | null,
    ): PaginationKey<WeekPageParams> | null => {
      if (pageIndex > 0) {
        const prev = previousPageData?.message;
        if (!prev?.has_more_weeks || !prev.next_date) {
          return null;
        }
      }

      const pageDate =
        pageIndex === 0
          ? date
          : (previousPageData?.message?.next_date as string);

      return [querySignature, pageIndex, { date: pageDate }] as const;
    },
    [date, querySignature],
  );

  const {
    data: paginatedData,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
    error,
  } = usePagination<TeamWeeksResponse>(
    "next_pms.timesheet.api.team.get_team_timesheet_weeks",
    getKey,
    {
      max_week: maxWeek,
      ...filterArgs,
    },
    {
      revalidateOnFocus: false,
      revalidateAll: false,
      revalidateFirstPage: false,
      keepPreviousData: true,
      persistSize: false,
      onError: (err) => {
        toast.error(parseFrappeErrorMsg(err as FrappeError), {
          id: "team-timesheet-weeks-fetch-error",
        });
      },
    },
  );

  const pages = useMemo(() => paginatedData ?? [], [paginatedData]);

  const weeks = useMemo(
    () =>
      pages
        .flatMap((page) =>
          (page.message?.weeks ?? []).map((week) => ({
            ...week,
            label: formatTimesheetWeekLabel(week.start_date, week.end_date),
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
        ),
    [pages],
  );

  const lastPayload = pages.at(-1)?.message;
  const hasMoreWeeks = lastPayload
    ? Boolean(lastPayload.has_more_weeks)
    : false;
  const isNextPageLoading =
    !isLoading && isValidating && typeof pages[size - 1] === "undefined";

  const loadMoreWeeks = useCallback(() => {
    if (isLoading || isNextPageLoading || !hasMoreWeeks) {
      return;
    }
    void setSize((current) => current + 1);
  }, [hasMoreWeeks, isLoading, isNextPageLoading, setSize]);

  const refreshWeeks = useCallback(() => mutate(), [mutate]);

  return {
    weeks,
    hasMoreWeeks,
    isLoadingWeeks: isLoading,
    isNextPageLoading,
    loadMoreWeeks,
    refreshWeeks,
    error: error as FrappeError | undefined,
  };
}
