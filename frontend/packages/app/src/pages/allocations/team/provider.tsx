/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { parseFrappeErrorMsg } from "@/lib/utils";
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
  const toast = useToasts();
  const [state, dispatch] = useReducer(
    allocationsTeamReducer,
    undefined,
    createInitialAllocationsTeamState,
  );

  const debouncedSearch = useDebounce(state.searchInput, 400);

  const { members, hasMore, totalCount, isLoading, error, refresh } =
    useAllocationsTeamData({
      anchorDate: state.anchorDate,
      weekCount: state.weekCount,
      search: debouncedSearch,
      start: state.start,
      pageLength: state.pageLength,
    });

  useEffect(() => {
    if (!state.isLoading && !isLoading) {
      return;
    }

    // Hook started loading while reducer hasn't been flagged yet.
    if (!state.isLoading) {
      dispatch({ type: "DATA_LOADING" });
      return;
    }

    // Reducer is in loading mode and hook is still fetching.
    if (isLoading) {
      return;
    }

    if (error) {
      dispatch({ type: "DATA_LOAD_FAILED" });
      toast.error(parseFrappeErrorMsg(error as FrappeError));
      return;
    }

    dispatch({
      type: "DATA_LOADED",
      payload: { members, hasMore, totalCount },
    });
  }, [error, isLoading, members, hasMore, totalCount, state.isLoading, toast]);

  const setSearch = useCallback((value: string) => {
    dispatch({ type: "SEARCH_CHANGED", payload: value });
  }, []);

  const setDuration = useCallback((value: AllocationsDuration) => {
    dispatch({ type: "DURATION_CHANGED", payload: value });
  }, []);

  const loadMore = useCallback(() => {
    dispatch({ type: "LOAD_MORE" });
  }, []);

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
      state,
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
      state,
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
