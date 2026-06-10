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
  useState,
} from "react";
import { ApprovalStatusLabelMap } from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappeEventListener, useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import {
  buildCompositeFilters,
  isCompleteFilterCondition,
  parseFrappeErrorMsg,
} from "@/lib/utils";
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
import { useTimesheetFilters } from "../hooks/useTimesheetFilters";

export const PersonalTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    timesheetReducer,
    undefined,
    createInitialTimesheetState,
  );

  const toast = useToasts();
  const { filters, setSearch, setApprovalStatus, setCompositeFilters } =
    useTimesheetFilters({
      includeApprovalStatus: true,
    });
  const debouncedSearch = useDebounce(filters.search, 400);

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );

  const hasActiveFilters = computeHasActiveFilters(
    {
      search: debouncedSearch,
      approvalStatus: filters.approvalStatus,
    },
    effectiveCompositeFilters,
  );

  const { startDate, maxWeek, frappeFilters } = useMemo(
    () => buildCompositeFilters(effectiveCompositeFilters),
    [effectiveCompositeFilters],
  );

  const activeFilterKey = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearch,
        approvalStatus: filters.approvalStatus ?? "",
        compositeFilters: effectiveCompositeFilters,
      }),
    [debouncedSearch, filters.approvalStatus, effectiveCompositeFilters],
  );
  const [resolvedFilterKey, setResolvedFilterKey] = useState(activeFilterKey);
  const isFilterRequest = activeFilterKey !== resolvedFilterKey;

  useEffect(() => {
    if (!isFilterRequest || state.isFilterRequest) {
      return;
    }

    dispatch({ type: "FILTER_REFRESH_STARTED" });
  }, [isFilterRequest, state.isFilterRequest]);

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employeeId,
      start_date:
        startDate ?? (isFilterRequest ? getTodayDate() : state.weekDate),
      max_week: maxWeek ?? NUMBER_OF_WEEKS_TO_FETCH,
      search: debouncedSearch,
      approval_status: filters.approvalStatus
        ? ApprovalStatusLabelMap[filters.approvalStatus]
        : null,
      filters: JSON.stringify(frappeFilters),
      skip_empty_weeks: hasActiveFilters,
    },
  );

  useEffect(() => {
    if (data) {
      dispatch({
        type: "DATA_LOADED",
        payload: {
          message: data.message,
          hasActiveFilters,
          replaceData: isFilterRequest,
        },
      });
      setResolvedFilterKey(activeFilterKey);
    }

    if (error) {
      if (isFilterRequest) {
        dispatch({ type: "FILTER_REFRESH_FINISHED" });
        setResolvedFilterKey(activeFilterKey);
      }

      const err = parseFrappeErrorMsg(error);
      toast.error(err || "Failed to load personal timesheet.");
    }
  }, [activeFilterKey, data, error, hasActiveFilters, isFilterRequest, toast]);

  useFrappeEventListener(`timesheet_update::${employeeId}`, (payload) => {
    const updatedData = payload.message;
    const key = Object.keys(updatedData.data)[0];

    if (!Object.prototype.hasOwnProperty.call(state.timesheetData.data, key)) {
      return;
    }

    dispatch({ type: "REALTIME_UPDATE", payload: updatedData });
  });

  const { data: likedTasksResponse, mutate: refetchLikedTasks } =
    useFrappeGetCall("next_pms.timesheet.api.task.get_liked_tasks");

  const loadData = useCallback(() => {
    if (!state.hasMoreWeeks || isLoading) return;

    const weeks = state.timesheetData.data;
    if (Object.keys(weeks).length === 0) return;

    const lastKey = Object.keys(weeks).pop();
    if (!lastKey) return;

    dispatch({
      type: "SET_WEEK_DATE",
      payload: getFormatedDate(addDays(weeks[lastKey].start_date, -1)),
    });
  }, [state.hasMoreWeeks, isLoading, state.timesheetData.data]);

  const value: PersonalTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMoreWeeks: state.hasMoreWeeks,
        isLoadingPersonalData: isLoading,
        isInitialLoad: state.isInitialLoad,
        isFilterRequest,
        timesheetData: state.timesheetData,
        filters: {
          search: filters.search,
          approvalStatus: filters.approvalStatus,
        },
        compositeFilters: filters.compositeFilters,
        likedTaskData: likedTasksResponse?.message ?? [],
      },
      actions: {
        loadData,
        handleSearchChange: setSearch,
        handleApprovalStatusChange: setApprovalStatus,
        handleCompositeFilterChange: setCompositeFilters,
        refetchLikedTasks,
      },
    }),
    [
      state.hasMoreWeeks,
      state.isInitialLoad,
      state.timesheetData,
      isLoading,
      isFilterRequest,
      likedTasksResponse,
      loadData,
      filters.search,
      filters.approvalStatus,
      filters.compositeFilters,
      setSearch,
      setApprovalStatus,
      setCompositeFilters,
      refetchLikedTasks,
    ],
  );

  return (
    <PersonalTimesheetContext.Provider value={value}>
      {children}
    </PersonalTimesheetContext.Provider>
  );
};
