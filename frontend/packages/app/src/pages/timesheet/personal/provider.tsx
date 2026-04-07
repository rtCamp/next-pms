/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  ApprovalStatusLabelMap,
  ApprovalStatusType,
} from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
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
import {
  PersonalTimesheetContext,
  type PersonalTimesheetContextProps,
} from "./context";
import {
  computeHasActiveFilters,
  createInitialTimesheetState,
  timesheetReducer,
} from "./reducer";
import { validateDate } from "./utils";

export const PersonalTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    timesheetReducer,
    undefined,
    createInitialTimesheetState,
  );

  const toast = useToasts();
  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const hasActiveFilters = computeHasActiveFilters(
    state.filters,
    state.compositeFilters,
  );

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employeeId,
      start_date: state.weekDate,
      max_week: NUMBER_OF_WEEKS_TO_FETCH,
      search: state.filters.search,
      approval_status: state.filters.approvalStatus
        ? ApprovalStatusLabelMap[state.filters.approvalStatus]
        : null,
      compositeFilters: JSON.stringify(state.compositeFilters),
      skip_empty_weeks: hasActiveFilters,
    },
  );

  useEffect(() => {
    if (data) {
      dispatch({ type: "DATA_LOADED", payload: { message: data.message } });
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err || "Failed to load personal timesheet.");
    }
  }, [data, error, toast]);

  useEffect(() => {
    if (Object.keys(state.timesheetData.data).length === 0) return;

    if (!validateDate(startDateParam, state.timesheetData)) {
      const lastKey = Object.keys(state.timesheetData.data).pop();
      if (!lastKey) return;

      const week = state.timesheetData.data[lastKey];
      dispatch({
        type: "SET_WEEK_DATE",
        payload: getFormatedDate(addDays(week.start_date, -1)),
      });
    }
  }, [startDateParam, state.timesheetData]);

  useFrappeEventListener(`timesheet_update::${employeeId}`, (payload) => {
    const updatedData = payload.message;
    const key = Object.keys(updatedData.data)[0];

    if (!Object.prototype.hasOwnProperty.call(state.timesheetData.data, key)) {
      return;
    }

    dispatch({ type: "REALTIME_UPDATE", payload: updatedData });
  });

  const { data: likedTasksResponse } = useFrappeGetCall(
    "next_pms.timesheet.api.task.get_liked_tasks",
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setStartDateParam("");
      dispatch({ type: "SEARCH_CHANGED", payload: value });
    },
    [setStartDateParam],
  );

  const handleApprovalStatusChange = useCallback(
    (value?: ApprovalStatusType | null) => {
      setStartDateParam("");
      dispatch({
        type: "APPROVAL_STATUS_CHANGED",
        payload: value ?? undefined,
      });
    },
    [setStartDateParam],
  );

  const handleCompositeFilterChange = useCallback(
    (value: FilterCondition[]) => {
      setStartDateParam("");
      dispatch({ type: "COMPOSITE_FILTERS_CHANGED", payload: value });
    },
    [setStartDateParam],
  );

  const loadData = useCallback(() => {
    if (!state.hasMoreWeeks || isLoading) return;

    const weeks = state.timesheetData.data;
    if (Object.keys(weeks).length === 0) return;

    const lastKey = Object.keys(weeks).pop();
    if (!lastKey) return;

    setStartDateParam("");
    dispatch({
      type: "SET_WEEK_DATE",
      payload: getFormatedDate(addDays(weeks[lastKey].start_date, -1)),
    });
  }, [
    state.hasMoreWeeks,
    isLoading,
    state.timesheetData.data,
    setStartDateParam,
  ]);

  const value: PersonalTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMoreWeeks: state.hasMoreWeeks,
        isLoadingPersonalData: isLoading,
        isIntialLoad: state.isInitialLoad,
        isFilterRequest: state.isFilterRequest,
        timesheetData: state.timesheetData,
        filters: state.filters,
        compositeFilters: state.compositeFilters,
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
      state.hasMoreWeeks,
      state.isInitialLoad,
      state.isFilterRequest,
      state.timesheetData,
      state.filters,
      state.compositeFilters,
      isLoading,
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
