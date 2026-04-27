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

  const { members, isLoading, error, refresh } = useAllocationsTeamData({
    anchorDate: state.anchorDate,
    weekCount: state.weekCount,
    search: debouncedSearch,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch({ type: "DATA_LOADING" });
      return;
    }

    if (error) {
      dispatch({ type: "DATA_LOAD_FAILED" });
      toast.error(parseFrappeErrorMsg(error as FrappeError));
      return;
    }

    dispatch({ type: "DATA_LOADED", payload: members });
  }, [error, isLoading, members, toast]);

  const setSearch = useCallback((value: string) => {
    dispatch({ type: "SEARCH_CHANGED", payload: value });
  }, []);

  const setDuration = useCallback((value: AllocationsDuration) => {
    dispatch({ type: "DURATION_CHANGED", payload: value });
  }, []);

  const handlePrevious = useCallback(() => {
    if (state.duration === "all-time") return;
    dispatch({ type: "MOVE_PREVIOUS" });
  }, [state.duration]);

  const handleNext = useCallback(() => {
    if (state.duration === "all-time") return;
    dispatch({ type: "MOVE_NEXT" });
  }, [state.duration]);

  const handleToday = useCallback(() => {
    if (state.duration === "all-time") return;
    dispatch({ type: "MOVE_TODAY" });
  }, [state.duration]);

  const value = useMemo<AllocationsTeamContextProps>(
    () => ({
      state,
      actions: {
        setSearch,
        setDuration,
        handlePrevious,
        handleNext,
        handleToday,
        refresh,
      },
    }),
    [
      state,
      setSearch,
      setDuration,
      handlePrevious,
      handleNext,
      handleToday,
      refresh,
    ],
  );

  return (
    <AllocationsTeamContext.Provider value={value}>
      {children}
    </AllocationsTeamContext.Provider>
  );
}
