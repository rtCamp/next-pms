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
import { ApprovalStatusLabelMap } from "@next-pms/design-system/components";
import { getTodayDate } from "@next-pms/design-system/date";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeEventListener } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  buildCompositeFilters,
  isCompleteFilterCondition,
  parseFrappeErrorMsg,
} from "@/lib/utils";
import { TEAM_WEEKS_PER_PAGE } from "./constants";
import {
  type MemberRefreshHandler,
  TeamTimesheetContext,
  type TeamTimesheetContextProps,
} from "./context";
import type {
  TeamFilterArgs,
  TeamMemberPayload,
  TeamWeekSummary,
} from "./types";
import { useTeamTimesheetWeeks } from "./useTeamTimesheetWeeks";
import { useTimesheetFilters } from "../hooks/useTimesheetFilters";

export const TeamTimesheetProvider: FC<PropsWithChildren> = ({ children }) => {
  const toast = useToasts();
  const {
    filters,
    setSearch,
    setApprovalStatus,
    setReportsTo,
    setCompositeFilters,
    resetAll,
  } = useTimesheetFilters({
    includeApprovalStatus: true,
    includeReportsTo: true,
  });

  const uiFilters = useMemo(
    () => ({
      search: filters.search,
      approvalStatus: filters.approvalStatus,
      reportsTo: filters.reportsTo,
    }),
    [filters.search, filters.approvalStatus, filters.reportsTo],
  );

  // Only pass complete filter conditions to the data hook so that selecting a
  // field (without an operator/value) does not trigger a reset + network request.
  const effectiveCompositeFilters = useMemo(
    () => filters.compositeFilters.filter(isCompleteFilterCondition),
    [filters.compositeFilters],
  );

  const { startDate, endDate, maxWeek, frappeFilters } = useMemo(
    () => buildCompositeFilters(effectiveCompositeFilters),
    [effectiveCompositeFilters],
  );

  const weekDate = startDate ?? getTodayDate();
  const weeksPerPage = startDate ? maxWeek : TEAM_WEEKS_PER_PAGE;
  const isDateBounded = Boolean(startDate && endDate);

  const filterArgs = useMemo<TeamFilterArgs>(
    () => ({
      reports_to: filters.reportsTo || null,
      search: filters.search || null,
      status_filter: filters.approvalStatus
        ? JSON.stringify([ApprovalStatusLabelMap[filters.approvalStatus]])
        : null,
      filters: frappeFilters.length > 0 ? JSON.stringify(frappeFilters) : null,
    }),
    [filters.reportsTo, filters.search, filters.approvalStatus, frappeFilters],
  );

  const activeFilterKey = useMemo(
    () => JSON.stringify({ weekDate, weeksPerPage, ...filterArgs }),
    [weekDate, weeksPerPage, filterArgs],
  );
  const [resolvedFilterKey, setResolvedFilterKey] = useState(activeFilterKey);
  const isFilterRequest = activeFilterKey !== resolvedFilterKey;

  const {
    weeks: freshWeeks,
    hasMoreWeeks: hasMoreWeeksFromApi,
    isLoadingWeeks,
    isNextPageLoading,
    loadMoreWeeks,
    refreshWeeks,
    error,
  } = useTeamTimesheetWeeks({
    date: weekDate,
    maxWeek: weeksPerPage,
    filterArgs,
  });

  const hasMoreWeeks = isDateBounded ? false : hasMoreWeeksFromApi;

  // Keep the last non-empty result so that during a filter-triggered reload the
  // table stays visible (faded) instead of blinking through an empty state.
  const staleWeeksRef = useRef<TeamWeekSummary[]>(freshWeeks);
  if (freshWeeks.length > 0) {
    staleWeeksRef.current = freshWeeks;
  }
  const weeks =
    freshWeeks.length > 0 || !isLoadingWeeks
      ? freshWeeks
      : staleWeeksRef.current;

  useEffect(() => {
    if (isLoadingWeeks) return;
    setResolvedFilterKey(activeFilterKey);

    if (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilterKey, isLoadingWeeks, error]);

  // Keep a registry of refresh handlers for each week so that when a member's
  // timesheet is updated, we can trigger a refresh for that specific week.
  const refreshRegistry = useRef<Map<string, MemberRefreshHandler>>(new Map());
  const registerMemberRefresh = useCallback(
    (weekStartDate: string, handler: MemberRefreshHandler) => {
      refreshRegistry.current.set(weekStartDate, handler);
      return () => {
        if (refreshRegistry.current.get(weekStartDate) === handler) {
          refreshRegistry.current.delete(weekStartDate);
        }
      };
    },
    [],
  );

  const weeksRef = useRef(weeks);
  weeksRef.current = weeks;

  const handleTimesheetInfo = useCallback(
    (info: { message?: TeamMemberPayload | null; start_date?: string }) => {
      if (!info?.start_date) return;

      const week = weeksRef.current.find((w) =>
        w.dates.includes(info.start_date!),
      );
      const handler = refreshRegistry.current.get(
        week?.start_date ?? info.start_date,
      );
      if (!handler) return;

      if (info.message) {
        handler(info.message);
      }
      void refreshWeeks();
    },
    [refreshWeeks],
  );

  useFrappeEventListener("timesheet_info", handleTimesheetInfo);

  const value: TeamTimesheetContextProps = useMemo(
    () => ({
      state: {
        weeks,
        hasMoreWeeks,
        isLoadingWeeks,
        isNextPageLoading,
        isFilterRequest,
        activeFilterKey,
        resolvedFilterKey,
        filterArgs,
        filters: uiFilters,
        compositeFilters: filters.compositeFilters,
      },
      actions: {
        loadMoreWeeks,
        registerMemberRefresh,
        handleSearchChange: setSearch,
        handleApprovalStatusChange: setApprovalStatus,
        handleReportsToChange: setReportsTo,
        handleCompositeFilterChange: setCompositeFilters,
        handleClearAllFilters: resetAll,
      },
    }),
    [
      weeks,
      hasMoreWeeks,
      isLoadingWeeks,
      isNextPageLoading,
      isFilterRequest,
      activeFilterKey,
      resolvedFilterKey,
      filterArgs,
      uiFilters,
      filters.compositeFilters,
      loadMoreWeeks,
      registerMemberRefresh,
      setSearch,
      setApprovalStatus,
      setReportsTo,
      setCompositeFilters,
      resetAll,
    ],
  );

  return (
    <TeamTimesheetContext.Provider value={value}>
      {children}
    </TeamTimesheetContext.Provider>
  );
};
