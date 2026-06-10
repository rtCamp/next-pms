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
  useRef,
  useState,
} from "react";
import { ApprovalStatusLabelMap } from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
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
import { validateDate } from "./utils";
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
  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");
  const { filters, setSearch, setApprovalStatus, setCompositeFilters } =
    useTimesheetFilters({
      includeApprovalStatus: true,
      clearKeysOnChange: ["date"],
    });
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, setSearch]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const hasActiveFilters = computeHasActiveFilters(
    {
      search: filters.search,
      approvalStatus: filters.approvalStatus,
    },
    effectiveCompositeFilters,
  );

  const { startDate, maxWeek, frappeFilters } = useMemo(
    () => buildCompositeFilters(effectiveCompositeFilters),
    [effectiveCompositeFilters],
  );

  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        search: filters.search,
        approvalStatus: filters.approvalStatus ?? "",
        compositeFilters: effectiveCompositeFilters,
      }),
    [filters.search, filters.approvalStatus, effectiveCompositeFilters],
  );
  const previousFilterSignatureRef = useRef(filterSignature);

  useEffect(() => {
    if (previousFilterSignatureRef.current === filterSignature) {
      return;
    }

    dispatch({ type: "FILTER_REQUEST_STARTED" });
    previousFilterSignatureRef.current = filterSignature;
  }, [filterSignature]);

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employeeId,
      start_date: startDate ?? state.weekDate,
      max_week: maxWeek ?? NUMBER_OF_WEEKS_TO_FETCH,
      search: filters.search,
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
        payload: { message: data.message, hasActiveFilters },
      });
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err || "Failed to load personal timesheet.");
    }
  }, [data, error, hasActiveFilters, toast]);

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

  const { data: likedTasksResponse, mutate: refetchLikedTasks } =
    useFrappeGetCall("next_pms.timesheet.api.task.get_liked_tasks");

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

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
        isInitialLoad: state.isInitialLoad,
        isFilterRequest: state.isFilterRequest,
        timesheetData: state.timesheetData,
        filters: {
          search: filters.search,
          approvalStatus: filters.approvalStatus,
        },
        searchInput,
        compositeFilters: filters.compositeFilters,
        likedTaskData: likedTasksResponse?.message ?? [],
      },
      actions: {
        loadData,
        handleSearchChange,
        handleApprovalStatusChange: setApprovalStatus,
        handleCompositeFilterChange: setCompositeFilters,
        refetchLikedTasks,
      },
    }),
    [
      state.hasMoreWeeks,
      state.isInitialLoad,
      state.isFilterRequest,
      state.timesheetData,
      isLoading,
      likedTasksResponse,
      loadData,
      filters.search,
      filters.approvalStatus,
      filters.compositeFilters,
      searchInput,
      handleSearchChange,
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
