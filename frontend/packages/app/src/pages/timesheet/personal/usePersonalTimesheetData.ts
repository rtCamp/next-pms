/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { ApprovalStatusLabelMap } from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { type PaginationKey, usePagination } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { addDays, parseISO } from "date-fns";
import type { FrappeError } from "frappe-react-sdk";
import { useFrappeEventListener, useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import {
  buildCompositeFilters,
  hashString,
  parseFrappeErrorMsg,
} from "@/lib/utils";
import type { DataProp, TaskDataProps } from "@/types/timesheet";
import { initialTimesheetData } from "./context";
import { addWeekLabels, mergeTimesheetData } from "./utils";

type UsePersonalTimesheetDataOptions = {
  employeeId: string;
  search: string;
  approvalStatus?: keyof typeof ApprovalStatusLabelMap;
  compositeFilters: FilterCondition[];
};

type UsePersonalTimesheetDataResult = {
  hasMoreWeeks: boolean;
  isLoadingPersonalData: boolean;
  isInitialLoad: boolean;
  isFilterRequest: boolean;
  timesheetData: DataProp;
  likedTaskData: TaskDataProps[];
  loadData: () => void;
  refetchLikedTasks: () => void;
};

type PersonalTimesheetPayload = DataProp & {
  has_more?: boolean;
};

type PersonalTimesheetCallResponse = {
  message?: PersonalTimesheetPayload;
};

type PersonalTimesheetPageParams = {
  start_date: string;
};

const QUERY_SIGNATURE_PREFIX = "personal-timesheet:";

const hasActiveFilters = (
  search: string,
  approvalStatus: keyof typeof ApprovalStatusLabelMap | undefined,
  compositeFilters: FilterCondition[],
) =>
  search.trim().length > 0 ||
  Boolean(approvalStatus) ||
  compositeFilters.length > 0;

const getNextPageStartDate = (payload?: PersonalTimesheetPayload) => {
  const weeks = Object.values(payload?.data ?? {});
  const lastWeek = weeks.at(-1);

  if (!lastWeek) {
    return null;
  }

  return getFormatedDate(addDays(parseISO(lastWeek.start_date), -1));
};

const hasWeek = (
  payload: PersonalTimesheetPayload | undefined,
  weekKey: string,
) => Object.prototype.hasOwnProperty.call(payload?.data ?? {}, weekKey);

export function usePersonalTimesheetData({
  employeeId,
  search,
  approvalStatus,
  compositeFilters,
}: UsePersonalTimesheetDataOptions): UsePersonalTimesheetDataResult {
  const toast = useToasts();

  const filtersAreActive = hasActiveFilters(
    search,
    approvalStatus,
    compositeFilters,
  );
  const { startDate, maxWeek, frappeFilters } = useMemo(
    () => buildCompositeFilters(compositeFilters),
    [compositeFilters],
  );

  const requestWeekDate = startDate ?? getTodayDate();
  const weeksPerPage = maxWeek ?? NUMBER_OF_WEEKS_TO_FETCH;
  const approvalStatusParam = approvalStatus
    ? ApprovalStatusLabelMap[approvalStatus]
    : null;
  const filtersParam = useMemo(
    () => JSON.stringify(frappeFilters),
    [frappeFilters],
  );

  const querySignature = useMemo(
    () =>
      `${QUERY_SIGNATURE_PREFIX}${hashString(
        JSON.stringify({
          employeeId,
          requestWeekDate,
          maxWeek: weeksPerPage,
          search,
          approvalStatus: approvalStatusParam ?? "",
          filters: filtersParam,
          skipEmptyWeeks: filtersAreActive,
        }),
      )}`,
    [
      approvalStatusParam,
      employeeId,
      filtersAreActive,
      filtersParam,
      weeksPerPage,
      requestWeekDate,
      search,
    ],
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: PersonalTimesheetCallResponse | null,
    ): PaginationKey<PersonalTimesheetPageParams> | null => {
      if (
        filtersAreActive &&
        previousPageData?.message &&
        !previousPageData.message.has_more
      ) {
        return null;
      }

      const pageStartDate =
        pageIndex === 0
          ? requestWeekDate
          : getNextPageStartDate(previousPageData?.message);

      if (!pageStartDate) {
        return null;
      }

      return [
        querySignature,
        pageIndex,
        { start_date: pageStartDate },
      ] as const;
    },
    [filtersAreActive, querySignature, requestWeekDate],
  );

  const {
    data: paginatedData,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = usePagination<PersonalTimesheetCallResponse>(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    getKey,
    {
      employee: employeeId,
      max_week: weeksPerPage,
      search,
      approval_status: approvalStatusParam,
      filters: filtersParam,
      skip_empty_weeks: filtersAreActive,
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

  const { data: likedTasksResponse, mutate: refetchLikedTasks } =
    useFrappeGetCall("next_pms.timesheet.api.task.get_liked_tasks");

  const pages = useMemo(() => paginatedData ?? [], [paginatedData]);
  const payloads = useMemo(
    () =>
      pages
        .map((page) => page.message)
        .filter((payload): payload is PersonalTimesheetPayload =>
          Boolean(payload),
        ),
    [pages],
  );

  const timesheetData = useMemo(() => {
    return (
      payloads.reduce<DataProp | null>((currentData, payload) => {
        const labeledPayload = addWeekLabels(payload);

        return currentData
          ? mergeTimesheetData(currentData, labeledPayload)
          : labeledPayload;
      }, null) ?? initialTimesheetData
    );
  }, [payloads]);

  const lastPayload = payloads.at(-1);
  const hasDateRangeFilter = Boolean(startDate);
  const hasMoreWeeks = filtersAreActive
    ? !hasDateRangeFilter && Boolean(lastPayload?.has_more)
    : true;
  const isInitialLoad = isLoading && pages.length === 0;
  const isFilterRequest = isLoading && pages.length > 0;
  const isNextPageLoading =
    !isLoading && isValidating && typeof pages[size - 1] === "undefined";
  const isLoadingPersonalData = isLoading || isNextPageLoading;

  const refreshPageForWeek = useCallback(
    async (weekKey: string) => {
      try {
        if (!paginatedData?.length) {
          return;
        }

        const pagesToRevalidate = new Set<number>();

        paginatedData.forEach((page, index) => {
          if (hasWeek(page.message, weekKey)) {
            pagesToRevalidate.add(index);
          }
        });

        if (!pagesToRevalidate.size) {
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
        return;
      }
    },
    [mutate, paginatedData],
  );

  const mergeRealtimePayload = useCallback(
    (payload: PersonalTimesheetPayload, weekKey: string) => {
      if (!paginatedData?.length) {
        return;
      }

      const updatedData = addWeekLabels(payload);
      let changed = false;
      const nextPages = paginatedData.map((page) => {
        if (!page.message || !hasWeek(page.message, weekKey)) {
          return page;
        }

        changed = true;

        return {
          ...page,
          message: mergeTimesheetData(page.message, updatedData),
        };
      });

      if (changed) {
        void mutate(nextPages, { revalidate: false });
      }
    },
    [mutate, paginatedData],
  );

  useFrappeEventListener(`timesheet_update::${employeeId}`, (payload) => {
    const updatedPayload = payload.message as PersonalTimesheetPayload;
    const key = Object.keys(updatedPayload?.data ?? {})[0];

    if (!key) {
      return;
    }

    if (filtersAreActive) {
      void refreshPageForWeek(key);
      return;
    }

    mergeRealtimePayload(updatedPayload, key);
  });

  const loadData = useCallback(() => {
    if (!hasMoreWeeks || isLoadingPersonalData) return;

    void setSize((current) => current + 1);
  }, [hasMoreWeeks, isLoadingPersonalData, setSize]);

  return {
    hasMoreWeeks,
    isLoadingPersonalData,
    isInitialLoad,
    isFilterRequest,
    timesheetData,
    likedTaskData: likedTasksResponse?.message ?? [],
    loadData,
    refetchLikedTasks,
  };
}
