/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeEventListener } from "frappe-react-sdk";
import { useDebounce } from "@/hooks/useDebounce";
import { isCompleteFilterCondition, parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import {
  TeamTimesheetContext,
  type TeamTimesheetContextProps,
} from "./context";
import { useTeamTimesheetData } from "./useTeamTimesheetData";
import { useTimesheetFilters } from "../hooks/useTimesheetFilters";

export const TeamTimesheetProvider: FC<PropsWithChildren> = ({ children }) => {
  const toast = useToasts();
  const [isFilterRequest, setIsFilterRequest] = useState(false);
  const {
    filters,
    setSearch,
    setApprovalStatus,
    setReportsTo,
    setCompositeFilters,
  } = useTimesheetFilters({
    includeApprovalStatus: true,
    includeReportsTo: true,
  });
  const debouncedSearch = useDebounce(filters.search, 400);

  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  useEffect(() => {
    if (!employeeId || filters.reportsTo) {
      return;
    }

    setReportsTo(employeeId);
  }, [employeeId, filters.reportsTo, setReportsTo]);

  const uiFilters = useMemo(
    () => ({
      search: filters.search,
      approvalStatus: filters.approvalStatus,
      reportsTo: (filters.reportsTo ?? employeeId) || undefined,
    }),
    [employeeId, filters.search, filters.approvalStatus, filters.reportsTo],
  );

  const effectiveFilters = useMemo(
    () => ({
      search: debouncedSearch,
      approvalStatus: filters.approvalStatus,
      reportsTo: (filters.reportsTo ?? employeeId) || undefined,
    }),
    [debouncedSearch, employeeId, filters.reportsTo, filters.approvalStatus],
  );

  // Only pass complete filter conditions to the data hook so that selecting a
  // field (without an operator/value) does not trigger a reset + network request.
  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );
  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        filters: effectiveFilters,
        compositeFilters: effectiveCompositeFilters,
      }),
    [effectiveCompositeFilters, effectiveFilters],
  );
  const previousFilterSignatureRef = useRef(filterSignature);

  useEffect(() => {
    if (previousFilterSignatureRef.current === filterSignature) {
      return;
    }

    setIsFilterRequest(true);
    previousFilterSignatureRef.current = filterSignature;
  }, [filterSignature]);

  const {
    hasMore,
    isLoadingTeamData,
    weekGroups: freshWeekGroups,
    loadMore,
    handleRealtimeUpdate,
    error,
  } = useTeamTimesheetData({
    filters: effectiveFilters,
    compositeFilters: effectiveCompositeFilters,
  });

  // Keep the last non-empty result so that during a filter-triggered reload the
  // table stays visible (faded) instead of blinking through an empty state and
  // triggering the full-page spinner.
  const staleWeekGroupsRef = useRef(freshWeekGroups);
  if (freshWeekGroups.length > 0) {
    staleWeekGroupsRef.current = freshWeekGroups;
  }
  const weekGroups =
    freshWeekGroups.length > 0 || !isLoadingTeamData
      ? freshWeekGroups
      : staleWeekGroupsRef.current;

  useEffect(() => {
    if (isLoadingTeamData) return;
    setIsFilterRequest(false);

    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingTeamData, error]);

  useFrappeEventListener("timesheet_info", (payload) => {
    handleRealtimeUpdate(payload.message);
  });

  const value: TeamTimesheetContextProps = useMemo(
    () => ({
      state: {
        hasMore,
        isLoadingTeamData,
        isFilterRequest,
        weekGroups,
        filters: uiFilters,
        compositeFilters: filters.compositeFilters,
      },
      actions: {
        loadMore,
        handleSearchChange: setSearch,
        handleApprovalStatusChange: setApprovalStatus,
        handleReportsToChange: setReportsTo,
        handleCompositeFilterChange: setCompositeFilters,
      },
    }),
    [
      hasMore,
      isLoadingTeamData,
      isFilterRequest,
      loadMore,
      weekGroups,
      uiFilters,
      filters.compositeFilters,
      setSearch,
      setApprovalStatus,
      setReportsTo,
      setCompositeFilters,
    ],
  );

  return (
    <TeamTimesheetContext.Provider value={value}>
      {children}
    </TeamTimesheetContext.Provider>
  );
};
