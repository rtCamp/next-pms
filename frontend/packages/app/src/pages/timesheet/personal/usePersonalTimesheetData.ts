/**
 * External dependencies.
 */
import { useCallback, useMemo, useRef } from "react";
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
  approvalStatus?: (keyof typeof ApprovalStatusLabelMap)[];
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

const APPROVAL_STATUS_COUNT = Object.keys(ApprovalStatusLabelMap).filter(
  (status) => status !== "none",
).length;

const hasActiveFilters = (
  search: string,
  approvalStatus: (keyof typeof ApprovalStatusLabelMap)[] | undefined,
  compositeFilters: FilterCondition[],
) =>
  search.trim().length > 0 ||
  Boolean(approvalStatus?.length) ||
  compositeFilters.length > 0;

const getNextPageStartDate = (
  page: PersonalTimesheetCallResponse | null | undefined,
  requestedStartDate: string | undefined,
  weeksPerPage: number,
) => {
  const payload = page?.message;
  const lastWeek = Object.values(payload?.data ?? {}).at(-1);

  if (lastWeek) {
    return getFormatedDate(addDays(parseISO(lastWeek.start_date), -1));
  }

  // A filtered window can come back empty while older matches exist
  // (has_more), so skip one full window back from this page's request date.
  if (payload?.has_more && requestedStartDate) {
    return getFormatedDate(
      addDays(parseISO(requestedStartDate), -(weeksPerPage * 7)),
    );
  }

  return null;
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
  const pageStartDatesRef = useRef<{
    dates: string[];
    signature: string;
  }>({ dates: [], signature: "" });

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
  const approvalStatusParam =
    approvalStatus?.length && approvalStatus.length !== APPROVAL_STATUS_COUNT
      ? JSON.stringify(
          approvalStatus.map((status) => ApprovalStatusLabelMap[status]),
        )
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
      if (pageStartDatesRef.current.signature !== querySignature) {
        pageStartDatesRef.current = { dates: [], signature: querySignature };
      }

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
          : getNextPageStartDate(
              previousPageData,
              pageStartDatesRef.current.dates[pageIndex - 1],
              weeksPerPage,
            );

      if (!pageStartDate) {
        return null;
      }

      pageStartDatesRef.current.dates[pageIndex] = pageStartDate;

      return [
        querySignature,
        pageIndex,
        { start_date: pageStartDate },
      ] as const;
    },
    [filtersAreActive, querySignature, requestWeekDate, weeksPerPage],
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

  const nextPageStartDate = getNextPageStartDate(
    pages.at(-1),
    pageStartDatesRef.current.dates[pages.length - 1],
    weeksPerPage,
  );
  const emptySkipLimit = addDays(
    parseISO(
      Object.values(timesheetData.data).at(-1)?.start_date ?? requestWeekDate,
    ),
    -365,
  );
  const hasMoreWeeks = filtersAreActive
    ? Boolean(
        !startDate &&
        nextPageStartDate &&
        parseISO(nextPageStartDate) > emptySkipLimit &&
        payloads.at(-1)?.has_more,
      )
    : true;
  const isInitialLoad = isLoading && pages.length === 0;
  const isFilterRequest = isLoading && pages.length > 0;
  const isLoadingPersonalData =
    isLoading || (isValidating && typeof pages[size - 1] === "undefined");

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
