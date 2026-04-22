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
import { type ApprovalStatusType } from "@next-pms/design-system/components";
import { type FilterCondition } from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeEventListener } from "frappe-react-sdk";
import { useDebounce } from "@/hooks/useDebounce";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import {
  TeamTimesheetContext,
  type TeamTimesheetContextProps,
} from "./context";
import {
  createInitialTeamTimesheetState,
  teamTimesheetReducer,
} from "./reducer";
import { useTeamTimesheetData } from "./useTeamTimesheetData";

export const TeamTimesheetProvider: FC<PropsWithChildren> = ({ children }) => {
  const toast = useToasts();

  const [state, dispatch] = useReducer(
    teamTimesheetReducer,
    undefined,
    createInitialTeamTimesheetState,
  );

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const debouncedSearch = useDebounce(state.searchInput, 400);

  // Compute the full filters object with the debounced search.
  // Use employeeId as the default for reportsTo until the user changes it.
  const effectiveFilters = useMemo(
    () => ({
      ...state.filters,
      search: debouncedSearch,
      reportsTo: (state.filters.reportsTo ?? employeeId) || undefined,
    }),
    [state.filters, debouncedSearch, employeeId],
  );

  const { hasMore, isLoadingTeamData, weekGroups, loadMore, error } =
    useTeamTimesheetData({
      filters: effectiveFilters,
      compositeFilters: state.compositeFilters,
    });

  useEffect(() => {
    dispatch({ type: "DATA_LOADED", payload: weekGroups });

    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [weekGroups, error]);

  useFrappeEventListener("timesheet_info", (payload) => {
    dispatch({ type: "REALTIME_UPDATE", payload: payload.message });
  });

  const handleSearchChange = useCallback((value: string) => {
    dispatch({ type: "SEARCH_CHANGED", payload: value });
  }, []);

  const handleApprovalStatusChange = useCallback(
    (value?: ApprovalStatusType | null) => {
      dispatch({
        type: "APPROVAL_STATUS_CHANGED",
        payload: value ?? undefined,
      });
    },
    [],
  );

  const handleReportsToChange = useCallback((value: string | null) => {
    dispatch({ type: "REPORTS_TO_CHANGED", payload: value ?? null });
  }, []);

  const handleCompositeFilterChange = useCallback(
    (value: FilterCondition[]) => {
      dispatch({ type: "COMPOSITE_FILTERS_CHANGED", payload: value });
    },
    [],
  );

  const value: TeamTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMore,
        isLoadingTeamData,
        weekGroups: state.weekGroups,
        filters: effectiveFilters,
        searchInput: state.searchInput,
        compositeFilters: state.compositeFilters,
      },
      actions: {
        loadMore,
        handleSearchChange,
        handleApprovalStatusChange,
        handleReportsToChange,
        handleCompositeFilterChange,
      },
    }),
    [
      hasMore,
      isLoadingTeamData,
      loadMore,
      state.weekGroups,
      effectiveFilters,
      state.searchInput,
      state.compositeFilters,
      handleSearchChange,
      handleApprovalStatusChange,
      handleReportsToChange,
      handleCompositeFilterChange,
    ],
  );

  return (
    <TeamTimesheetContext.Provider value={value}>
      {children}
    </TeamTimesheetContext.Provider>
  );
};
