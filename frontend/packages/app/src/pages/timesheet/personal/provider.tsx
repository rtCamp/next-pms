/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ApprovalStatusLabelMap,
  ApprovalStatusType,
} from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappeEventListener, useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import type { DataProp, TimesheetFilters } from "@/types/timesheet";
import {
  initialTimesheetData,
  PersonalTimesheetContext,
  type PersonalTimesheetContextProps,
} from "./context";
import { mergeTimesheetData, validateDate } from "./utils";

export const PersonalTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const isFilterRequestRef = useRef(false);
  const toast = useToasts();
  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");
  const [weekDate, setWeekDate] = useState(getTodayDate());
  const [timesheetData, setTimesheetData] =
    useState<DataProp>(initialTimesheetData);
  const [hasMoreWeeks, setHasMoreWeeks] = useState(true);
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [filters, setFilters] = useState<TimesheetFilters>({
    search: "",
    approvalStatus: null,
  });

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    Boolean(filters.approvalStatus) ||
    compositeFilters.length > 0;

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employeeId,
      start_date: weekDate,
      max_week: NUMBER_OF_WEEKS_TO_FETCH,
      search: filters.search,
      approval_status: filters.approvalStatus
        ? ApprovalStatusLabelMap[filters.approvalStatus]
        : null,
      compositeFilters: JSON.stringify(compositeFilters),
    },
  );

  const resetWeekDateForFilters = useCallback(() => {
    isFilterRequestRef.current = true;
    setHasMoreWeeks(true);
    setTimesheetData(initialTimesheetData);
    setStartDateParam("");
    setWeekDate(getTodayDate());
  }, [setStartDateParam]);

  const handleSearchChange = useCallback(
    (value: string) => {
      resetWeekDateForFilters();
      setFilters((prev) => ({ ...prev, search: value }));
    },
    [resetWeekDateForFilters],
  );

  const handleApprovalStatusChange = useCallback(
    (value?: ApprovalStatusType | null) => {
      resetWeekDateForFilters();
      setFilters((prev) => ({
        ...prev,
        approvalStatus: value,
      }));
    },
    [resetWeekDateForFilters],
  );

  const handleCompositeFilterChange = useCallback(
    (value: FilterCondition[]) => {
      resetWeekDateForFilters();
      setCompositeFilters(value);
    },
    [resetWeekDateForFilters],
  );

  useEffect(() => {
    if (data) {
      const fetchedWeekCount = Object.keys(data.message?.data ?? {}).length;
      setHasMoreWeeks(
        hasActiveFilters
          ? fetchedWeekCount > 0
          : fetchedWeekCount === NUMBER_OF_WEEKS_TO_FETCH,
      );

      setTimesheetData((prev) => {
        if (isFilterRequestRef.current) {
          return data.message;
        }

        if (Object.keys(prev.data).length > 0) {
          return mergeTimesheetData(prev, data.message);
        }

        return data.message;
      });

      isFilterRequestRef.current = false;
    }

    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err || "Failed to load personal timesheet.");
    }
  }, [data, error, hasActiveFilters, toast]);

  useEffect(() => {
    if (Object.keys(timesheetData.data).length === 0) return;

    if (!validateDate(startDateParam, timesheetData)) {
      const lastKey = Object.keys(timesheetData.data).pop();
      if (!lastKey) return;

      const week = timesheetData.data[lastKey];
      setWeekDate(getFormatedDate(addDays(week.start_date, -1)));
    }
  }, [startDateParam, timesheetData]);

  useFrappeEventListener(`timesheet_update::${employeeId}`, (payload) => {
    const updatedData = payload.message;
    const key = Object.keys(updatedData.data)[0];

    if (!Object.prototype.hasOwnProperty.call(timesheetData.data, key)) {
      return;
    }

    setTimesheetData((prev) => mergeTimesheetData(prev, updatedData));
  });

  const { data: likedTasksResponse } = useFrappeGetCall(
    "next_pms.timesheet.api.task.get_liked_tasks",
  );

  const loadData = useCallback(() => {
    if (!hasMoreWeeks || isLoading) return;

    const weeks = timesheetData.data;
    if (Object.keys(weeks).length === 0) return;

    const lastKey = Object.keys(weeks).pop();
    if (!lastKey) return;

    setStartDateParam("");
    setWeekDate(getFormatedDate(addDays(weeks[lastKey].start_date, -1)));
  }, [hasMoreWeeks, isLoading, setStartDateParam, timesheetData.data]);

  const value: PersonalTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMoreWeeks,
        isLoadingPersonalData: isLoading,
        timesheetData,
        filters,
        compositeFilters,
        likedTaskData: likedTasksResponse?.message ?? [],
      },
      actions: {
        loadData,
        handleSearchChange,
        handleApprovalStatusChange,
        handleCompositeFilterChange,
      },
    }),
    [
      hasMoreWeeks,
      isLoading,
      timesheetData,
      filters,
      compositeFilters,
      likedTasksResponse,
      loadData,
      handleSearchChange,
      handleApprovalStatusChange,
      handleCompositeFilterChange,
    ],
  );

  return (
    <PersonalTimesheetContext.Provider value={value}>
      {children}
    </PersonalTimesheetContext.Provider>
  );
};
