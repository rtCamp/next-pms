/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { pickAllowed } from "@/lib/utils";
import { ALLOCATIONS_PAGE_SIZE } from "../constants";
import type { AllocationRefreshTargets, AllocationsDuration } from "../types";
import { teamAllocationsTypeOptions } from "./constants";
import {
  AllocationsTeamContext,
  type AllocationsTeamContextProps,
} from "./context";
import { useAllocationsTeamData } from "./useAllocationsTeamData";
import {
  getWeekCountForDuration,
  moveDateByDuration,
  parseAllocationAnchorDate,
  parseAllocationCompositeFilters,
  parseAllocationStringArray,
} from "../utils";

const SEARCH_PARAM_KEY = "search";
const DATE_PARAM_KEY = "date";
const DURATION_PARAM_KEY = "duration";
const DESIGNATION_PARAM_KEY = "designation";
const ALLOCATION_TYPE_PARAM_KEY = "allocationType";
const COMPOSITE_FILTERS_PARAM_KEY = "compositeFilters";
const DEFAULT_DURATION = "this-quarter";
const DURATION_PARAM_VALUES = [
  "this-week",
  "this-month",
  "this-quarter",
] as const satisfies readonly AllocationsDuration[];

export function AllocationsTeamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get(SEARCH_PARAM_KEY) ?? "";
  const [searchInput, setSearchInput] = useState(searchParam);

  const allocationTypeValues = useMemo(
    () => teamAllocationsTypeOptions.map((option) => option.value),
    [],
  );
  const designation = useMemo(
    () => parseAllocationStringArray(searchParams.get(DESIGNATION_PARAM_KEY)),
    [searchParams],
  );
  const duration =
    pickAllowed(searchParams.get(DURATION_PARAM_KEY), DURATION_PARAM_VALUES) ??
    DEFAULT_DURATION;
  const anchorDate = useMemo(
    () => parseAllocationAnchorDate(searchParams.get(DATE_PARAM_KEY)),
    [searchParams],
  );
  const allocationsType = useMemo(
    () =>
      parseAllocationStringArray(
        searchParams.get(ALLOCATION_TYPE_PARAM_KEY),
      ).filter((value) => allocationTypeValues.includes(value)),
    [allocationTypeValues, searchParams],
  );
  const compositeFilters = useMemo(
    () =>
      parseAllocationCompositeFilters(
        searchParams.get(COMPOSITE_FILTERS_PARAM_KEY),
      ),
    [searchParams],
  );
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

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === "") {
              next.delete(key);
              return;
            }

            next.set(key, value);
          });

          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const setSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (debouncedSearch !== searchInput || debouncedSearch === searchParam) {
      return;
    }

    updateSearchParams({ [SEARCH_PARAM_KEY]: debouncedSearch });
  }, [debouncedSearch, searchInput, searchParam, updateSearchParams]);

  const setDuration = useCallback(
    (value: AllocationsDuration) =>
      updateSearchParams({
        [DURATION_PARAM_KEY]: value === DEFAULT_DURATION ? undefined : value,
      }),
    [updateSearchParams],
  );

  const setDesignation = useCallback(
    (value: string[]) =>
      updateSearchParams({
        [DESIGNATION_PARAM_KEY]: value.length
          ? JSON.stringify(value)
          : undefined,
      }),
    [updateSearchParams],
  );

  const setAllocationsType = useCallback(
    (value: string[]) => {
      const nextValue =
        value.length === teamAllocationsTypeOptions.length ? [] : value;

      updateSearchParams({
        [ALLOCATION_TYPE_PARAM_KEY]: nextValue.length
          ? JSON.stringify(nextValue)
          : undefined,
      });
    },
    [updateSearchParams],
  );

  const setCompositeFilters = useCallback(
    (value: FilterCondition[]) =>
      updateSearchParams({
        [COMPOSITE_FILTERS_PARAM_KEY]: value.length
          ? JSON.stringify(value)
          : undefined,
      }),
    [updateSearchParams],
  );

  const handlePrevious = useCallback(() => {
    updateSearchParams({
      [DATE_PARAM_KEY]: format(
        moveDateByDuration(anchorDate, duration, false),
        "yyyy-MM-dd",
      ),
    });
  }, [anchorDate, duration, updateSearchParams]);

  const handleNext = useCallback(() => {
    updateSearchParams({
      [DATE_PARAM_KEY]: format(
        moveDateByDuration(anchorDate, duration, true),
        "yyyy-MM-dd",
      ),
    });
  }, [anchorDate, duration, updateSearchParams]);

  const handleToday = useCallback(() => {
    updateSearchParams({ [DATE_PARAM_KEY]: undefined });
  }, [updateSearchParams]);

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
        setAllocationsType,
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
      setAllocationsType,
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
