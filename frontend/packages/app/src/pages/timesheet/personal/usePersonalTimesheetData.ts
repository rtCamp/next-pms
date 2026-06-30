/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApprovalStatusLabelMap } from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappeEventListener, useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { buildCompositeFilters, parseFrappeErrorMsg } from "@/lib/utils";
import type { DataProp, TaskDataProps } from "@/types/timesheet";
import { initialTimesheetData } from "./context";
import { addWeekLabels, mergeTimesheetData } from "./utils";

type UsePersonalTimesheetDataOptions = {
  employeeId: string;
  requestKey: string;
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

const hasActiveFilters = (
  search: string,
  approvalStatus: keyof typeof ApprovalStatusLabelMap | undefined,
  compositeFilters: FilterCondition[],
) =>
  search.trim().length > 0 ||
  Boolean(approvalStatus) ||
  compositeFilters.length > 0;

export function usePersonalTimesheetData({
  employeeId,
  requestKey,
  search,
  approvalStatus,
  compositeFilters,
}: UsePersonalTimesheetDataOptions): UsePersonalTimesheetDataResult {
  const toast = useToasts();
  const [weekDate, setWeekDate] = useState(getTodayDate());
  const [hasMoreWeeks, setHasMoreWeeks] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [timesheetData, setTimesheetData] = useState(initialTimesheetData);
  const [resolvedRequestKey, setResolvedRequestKey] = useState(requestKey);

  const isFilterRequest = requestKey !== resolvedRequestKey;
  const filtersAreActive = hasActiveFilters(
    search,
    approvalStatus,
    compositeFilters,
  );
  const { startDate, maxWeek, frappeFilters } = useMemo(
    () => buildCompositeFilters(compositeFilters),
    [compositeFilters],
  );
  const requestWeekDate =
    startDate ?? (isFilterRequest ? getTodayDate() : weekDate);

  useEffect(() => {
    if (!isFilterRequest) {
      return;
    }

    setHasMoreWeeks(true);
    setWeekDate(startDate ?? getTodayDate());
  }, [isFilterRequest, startDate]);

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employeeId,
      start_date: requestWeekDate,
      max_week: maxWeek ?? NUMBER_OF_WEEKS_TO_FETCH,
      search,
      approval_status: approvalStatus
        ? ApprovalStatusLabelMap[approvalStatus]
        : null,
      filters: JSON.stringify(frappeFilters),
      skip_empty_weeks: filtersAreActive,
    },
  );
  const { data: likedTasksResponse, mutate: refetchLikedTasks } =
    useFrappeGetCall("next_pms.timesheet.api.task.get_liked_tasks");

  useEffect(() => {
    if (!data?.message) {
      return;
    }

    const labeledData = addWeekLabels(data.message);

    setTimesheetData((currentData) =>
      isFilterRequest || Object.keys(currentData.data).length === 0
        ? labeledData
        : mergeTimesheetData(currentData, labeledData),
    );
    setHasMoreWeeks(filtersAreActive ? (data.message.has_more ?? false) : true);
    setIsInitialLoad(false);
    setResolvedRequestKey(requestKey);
  }, [data, filtersAreActive, isFilterRequest, requestKey]);

  useEffect(() => {
    if (!error || !isFilterRequest) {
      return;
    }

    setResolvedRequestKey(requestKey);
  }, [error, isFilterRequest, requestKey]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const err = parseFrappeErrorMsg(error);
    toast.error(err);
  }, [error, toast]);

  useFrappeEventListener(`timesheet_update::${employeeId}`, (payload) => {
    const updatedData = addWeekLabels(payload.message);
    const key = Object.keys(updatedData.data)[0];

    setTimesheetData((currentData) => {
      if (!Object.prototype.hasOwnProperty.call(currentData.data, key)) {
        return currentData;
      }

      return mergeTimesheetData(currentData, updatedData);
    });
  });

  const loadData = useCallback(() => {
    if (!hasMoreWeeks || isLoading) return;

    const weeks = timesheetData.data;
    if (Object.keys(weeks).length === 0) return;

    const lastKey = Object.keys(weeks).pop();
    if (!lastKey) return;

    setWeekDate(getFormatedDate(addDays(weeks[lastKey].start_date, -1)));
  }, [hasMoreWeeks, isLoading, timesheetData.data]);

  return {
    hasMoreWeeks,
    isLoadingPersonalData: isLoading,
    isInitialLoad,
    isFilterRequest,
    timesheetData,
    likedTaskData: likedTasksResponse?.message ?? [],
    loadData,
    refetchLikedTasks,
  };
}
