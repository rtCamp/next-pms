/**
 * External dependencies.
 */
import { useCallback, useMemo, useReducer } from "react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import {
  AllocationsTeamContext,
  type AllocationsDuration,
  type AllocationsTeamContextProps,
} from "./context";
import {
  allocationsTeamReducer,
  createInitialAllocationsTeamState,
} from "./reducer";
import { useAllocationsTeamData } from "./useAllocationsTeamData";

export function AllocationsTeamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(
    allocationsTeamReducer,
    undefined,
    createInitialAllocationsTeamState,
  );

  const debouncedSearch = useDebounce(state.searchInput, 400);

  const { members, hasMore, isLoading, refresh } = useAllocationsTeamData({
    anchorDate: state.anchorDate,
    weekCount: state.weekCount,
    search: debouncedSearch,
    start: state.start,
    pageLength: state.pageLength,
  });

  const setSearch = useCallback((value: string) => {
    dispatch({ type: "SEARCH_CHANGED", payload: value });
  }, []);

  const setDuration = useCallback((value: AllocationsDuration) => {
    dispatch({ type: "DURATION_CHANGED", payload: value });
  }, []);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) {
      return;
    }

    dispatch({ type: "LOAD_MORE" });
  }, [hasMore, isLoading]);

  const handlePrevious = useCallback(() => {
    dispatch({ type: "MOVE_PREVIOUS" });
  }, []);

  const handleNext = useCallback(() => {
    dispatch({ type: "MOVE_NEXT" });
  }, []);

  const handleToday = useCallback(() => {
    dispatch({ type: "MOVE_TODAY" });
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const value = useMemo<AllocationsTeamContextProps>(
    () => ({
      state: {
        members,
        isLoading,
        isFilterRequest: state.start === 0,
        hasMore,
        searchInput: state.searchInput,
        duration: state.duration,
        weekCount: state.weekCount,
        anchorDate: state.anchorDate,
      },
      actions: {
        setSearch,
        setDuration,
        loadMore,
        handlePrevious,
        handleNext,
        handleToday,
        refresh: handleRefresh,
      },
    }),
    [
      members,
      isLoading,
      hasMore,
      state.start,
      state.searchInput,
      state.duration,
      state.weekCount,
      state.anchorDate,
      setSearch,
      setDuration,
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
