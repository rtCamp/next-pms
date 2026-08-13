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
import { PROJECT_WEEKS_PER_PAGE } from "./constants";
import {
  type ProjectRefreshHandler,
  ProjectTimesheetContext,
  type ProjectTimesheetContextProps,
} from "./context";
import type {
  ProjectFilterArgs,
  ProjectMemberWeekPayload,
  ProjectWeekSummary,
} from "./types";
import { useProjectTimesheetWeeks } from "./useProjectTimesheetWeeks";
import { useTimesheetFilters } from "../hooks/useTimesheetFilters";

export const ProjectTimesheetProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const toast = useToasts();
  const { filters, setSearch, setCompositeFilters, resetAll } =
    useTimesheetFilters();

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
  const weeksPerPage = startDate ? maxWeek : PROJECT_WEEKS_PER_PAGE;
  const isDateBounded = Boolean(startDate && endDate);

  const filterArgs = useMemo<ProjectFilterArgs>(
    () => ({
      search: filters.search || null,
      filters: frappeFilters.length > 0 ? JSON.stringify(frappeFilters) : null,
    }),
    [filters.search, frappeFilters],
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
  } = useProjectTimesheetWeeks({
    date: weekDate,
    maxWeek: weeksPerPage,
    filterArgs,
  });

  const hasMoreWeeks = isDateBounded ? false : hasMoreWeeksFromApi;

  // Keep the last non-empty result so that during a filter-triggered reload the
  // table stays visible (faded) instead of blinking through an empty state.
  const staleWeeksRef = useRef<ProjectWeekSummary[]>(freshWeeks);
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

  // Keep a registry of refresh handlers for each week so that when a project
  // timesheet is updated, we can reconcile that specific week's projects.
  const refreshRegistry = useRef<Map<string, ProjectRefreshHandler>>(new Map());
  const registerProjectRefresh = useCallback(
    (weekStartDate: string, handler: ProjectRefreshHandler) => {
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

  const handleProjectTimesheetInfo = useCallback(
    (info: {
      message?: ProjectMemberWeekPayload | null;
      start_date?: string;
    }) => {
      if (!info?.start_date) return;

      const week = weeksRef.current.find((w) =>
        w.dates.includes(info.start_date!),
      );
      if (!week) return;

      const handler = refreshRegistry.current.get(week.start_date);
      if (handler && info.message) {
        handler(info.message);
      }
      void refreshWeeks();
    },
    [refreshWeeks],
  );

  useFrappeEventListener("project_timesheet_info", handleProjectTimesheetInfo);

  const value: ProjectTimesheetContextProps = useMemo(
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
        filters: {
          search: filters.search,
        },
        compositeFilters: filters.compositeFilters,
      },
      actions: {
        loadMoreWeeks,
        registerProjectRefresh,
        handleSearchChange: setSearch,
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
      filters.search,
      filters.compositeFilters,
      loadMoreWeeks,
      registerProjectRefresh,
      setSearch,
      setCompositeFilters,
      resetAll,
    ],
  );

  return (
    <ProjectTimesheetContext.Provider value={value}>
      {children}
    </ProjectTimesheetContext.Provider>
  );
};
