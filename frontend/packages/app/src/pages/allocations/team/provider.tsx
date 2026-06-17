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
import { teamAllocationsTypeOptions } from "./constants";
import {
  AllocationsTeamContext,
  type AllocationsTeamContextProps,
} from "./context";
import { useAllocationsTeamData } from "./useAllocationsTeamData";
import { getWeekCountForDuration, moveDateByDuration } from "../utils";

export function AllocationsTeamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [designation, setDesignation] = useState<string[]>([]);
  const [duration, setDurationState] =
    useState<AllocationsDuration>("this-quarter");
  const [allocationsType, setAllocationsType] = useState<string[]>([]);
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const weekCount = getWeekCountForDuration(duration);

  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedDesignation = useDebounce(designation, 400);

  const {
    members,
    hasMore,
    isQueryLoading,
    isNextPageLoading,
    loadMore,
    refresh,
  } = useAllocationsTeamData({
    anchorDate,
    weekCount,
    search: debouncedSearch,
    designation: debouncedDesignation,
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
      value.length === teamAllocationsTypeOptions.length ? [] : value,
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
      await refresh(targets?.employeeIds);
    },
    [refresh],
  );

  const value = useMemo<AllocationsTeamContextProps>(
    () => ({
      state: {
        members,
        isQueryLoading,
        isNextPageLoading,
        hasMore,
        searchInput,
        designation,
        duration,
        allocationsType,
        compositeFilters,
        weekCount,
        anchorDate,
      },
      actions: {
        setSearch,
        setDuration,
        setDesignation,
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
      members,
      isNextPageLoading,
      isQueryLoading,
      hasMore,
      searchInput,
      duration,
      designation,
      allocationsType,
      compositeFilters,
      weekCount,
      anchorDate,
      setSearch,
      setDuration,
      setDesignation,
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
    <AllocationsTeamContext.Provider value={value}>
      {children}
    </AllocationsTeamContext.Provider>
  );
}
