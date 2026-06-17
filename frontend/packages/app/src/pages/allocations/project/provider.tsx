/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { ALLOCATIONS_PAGE_SIZE } from "../constants";
import type { AllocationRefreshTargets } from "../types";
import { AllocationsDuration } from "../types";
import { projectAllocationsTypeOptions } from "./constants";
import { getWeekCountForDuration, moveDateByDuration } from "../utils";
import {
  AllocationsProjectContext,
  type AllocationsProjectContextProps,
} from "./context";
import { useAllocationsProjectData } from "./useAllocationsProjectData";

export function AllocationsProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [duration, setDurationState] =
    useState<AllocationsDuration>("this-quarter");
  const [allocationsType, setAllocationsType] = useState<string[]>([]);
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const weekCount = getWeekCountForDuration(duration);

  const debouncedSearch = useDebounce(searchInput, 400);

  const {
    projects,
    hasMore,
    isQueryLoading,
    isNextPageLoading,
    loadMore,
    refresh,
  } = useAllocationsProjectData({
    anchorDate,
    weekCount,
    search: debouncedSearch,
    allocationsType,
    compositeFilters,
    pageLength: ALLOCATIONS_PAGE_SIZE,
  });

  const setSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const setDuration = useCallback((value: AllocationsDuration) => {
    setDurationState(value);
  }, []);

  const handleAllocationsTypeChange = useCallback((value: string[]) => {
    setAllocationsType(
      value.length === projectAllocationsTypeOptions.length ? [] : value,
    );
  }, []);

  const handlePrevious = useCallback(() => {
    setAnchorDate((currentAnchorDate) =>
      moveDateByDuration(currentAnchorDate, duration, false),
    );
  }, [duration]);

  const handleNext = useCallback(() => {
    setAnchorDate((currentAnchorDate) =>
      moveDateByDuration(currentAnchorDate, duration, true),
    );
  }, [duration]);

  const handleToday = useCallback(() => {
    setAnchorDate(new Date());
  }, []);

  const handleRefresh = useCallback(
    async (targets?: AllocationRefreshTargets) => {
      await refresh(targets?.projectIds);
    },
    [refresh],
  );

  const value = useMemo<AllocationsProjectContextProps>(
    () => ({
      state: {
        projects,
        isQueryLoading,
        isNextPageLoading,
        hasMore,
        searchInput,
        duration,
        allocationsType,
        compositeFilters,
        weekCount,
        anchorDate,
      },
      actions: {
        setSearch,
        setDuration,
        setAllocationsType: handleAllocationsTypeChange,
        setCompositeFilters,
        loadMore,
        handlePrevious,
        handleNext,
        handleToday,
        refresh: handleRefresh,
      },
    }),
    [
      projects,
      isQueryLoading,
      isNextPageLoading,
      hasMore,
      searchInput,
      duration,
      allocationsType,
      compositeFilters,
      weekCount,
      anchorDate,
      setSearch,
      setDuration,
      handleAllocationsTypeChange,
      setCompositeFilters,
      loadMore,
      handlePrevious,
      handleNext,
      handleToday,
      handleRefresh,
    ],
  );

  return (
    <AllocationsProjectContext.Provider value={value}>
      {children}
    </AllocationsProjectContext.Provider>
  );
}
