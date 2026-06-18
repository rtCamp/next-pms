/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { pickAllowed } from "@/lib/utils";
import { ALLOCATIONS_PAGE_SIZE } from "../constants";
import type { AllocationRefreshTargets, AllocationsDuration } from "../types";
import {
  getWeekCountForDuration,
  moveDateByDuration,
  parseAllocationAnchorDate,
  parseAllocationCompositeFilters,
  parseAllocationStringArray,
} from "../utils";
import { projectAllocationsTypeOptions } from "./constants";
import {
  AllocationsProjectContext,
  type AllocationsProjectContextProps,
} from "./context";
import { useAllocationsProjectData } from "./useAllocationsProjectData";

const SEARCH_PARAM_KEY = "search";
const DATE_PARAM_KEY = "date";
const DURATION_PARAM_KEY = "duration";
const ALLOCATION_TYPE_PARAM_KEY = "allocationType";
const COMPOSITE_FILTERS_PARAM_KEY = "compositeFilters";
const DEFAULT_DURATION = "this-quarter";
const DURATION_PARAM_VALUES = [
  "this-week",
  "this-month",
  "this-quarter",
] as const satisfies readonly AllocationsDuration[];

export function AllocationsProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get(SEARCH_PARAM_KEY) ?? "";

  const allocationTypeValues = useMemo(
    () => projectAllocationsTypeOptions.map((option) => option.value),
    [],
  );
  const duration =
    pickAllowed(searchParams.get(DURATION_PARAM_KEY), DURATION_PARAM_VALUES) ??
    DEFAULT_DURATION;
  const anchorDate = useMemo(
    () => parseAllocationAnchorDate(searchParams.get(DATE_PARAM_KEY)),
    [searchParams],
  );
  const allocationsType = useMemo(() => {
    const raw = searchParams.get(ALLOCATION_TYPE_PARAM_KEY);

    const parsed = parseAllocationStringArray(raw).filter((value) =>
      allocationTypeValues.includes(value),
    );

    return parsed;
  }, [allocationTypeValues, searchParams]);
  const compositeFilters = useMemo(
    () =>
      parseAllocationCompositeFilters(
        searchParams.get(COMPOSITE_FILTERS_PARAM_KEY),
      ),
    [searchParams],
  );
  const weekCount = getWeekCountForDuration(duration);

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
    search: searchParam,
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

  const setSearch = useCallback(
    (value: string) => updateSearchParams({ [SEARCH_PARAM_KEY]: value }),
    [updateSearchParams],
  );

  const setDuration = useCallback(
    (value: AllocationsDuration) =>
      updateSearchParams({
        [DURATION_PARAM_KEY]: value === DEFAULT_DURATION ? undefined : value,
      }),
    [updateSearchParams],
  );

  const setAllocationsType = useCallback(
    (value: string[]) => {
      const nextValue = value.filter((item) =>
        allocationTypeValues.includes(item),
      );

      updateSearchParams({
        [ALLOCATION_TYPE_PARAM_KEY]: nextValue.length
          ? JSON.stringify(nextValue)
          : undefined,
      });
    },
    [allocationTypeValues, updateSearchParams],
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
        search: searchParam,
        duration,
        allocationsType,
        compositeFilters,
        weekCount,
        anchorDate,
      },
      actions: {
        setSearch,
        setDuration,
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
      projects,
      isQueryLoading,
      isNextPageLoading,
      hasMore,
      searchParam,
      duration,
      allocationsType,
      compositeFilters,
      weekCount,
      anchorDate,
      setSearch,
      setDuration,
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
    <AllocationsProjectContext.Provider value={value}>
      {children}
    </AllocationsProjectContext.Provider>
  );
}
