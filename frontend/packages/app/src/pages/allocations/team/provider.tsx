/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { EMPLOYEES_PER_PAGE } from "./constants";
import {
  AllocationsTeamContext,
  type AllocationsDuration,
  type AllocationsTeamContextProps,
} from "./context";
import { useAllocationsTeamData } from "./useAllocationsTeamData";
import { getWeekCountForDuration, moveDateByDuration } from "./utils";

export function AllocationsTeamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [duration, setDurationState] =
    useState<AllocationsDuration>("this-quarter");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const weekCount = getWeekCountForDuration(duration);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { members, hasMore, isLoading, isLoadingMore, loadMore, refresh } =
    useAllocationsTeamData({
      anchorDate,
      weekCount,
      search: debouncedSearch,
      pageLength: EMPLOYEES_PER_PAGE,
    });

  const setSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const setDuration = useCallback((value: AllocationsDuration) => {
    setDurationState(value);
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
    async (employeeIds?: string[]) => {
      await refresh(employeeIds);
    },
    [refresh],
  );

  const value = useMemo<AllocationsTeamContextProps>(
    () => ({
      state: {
        members,
        isLoading,
        isFilterRequest: isLoading && !isLoadingMore,
        hasMore,
        searchInput,
        duration,
        weekCount,
        anchorDate,
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
      isLoadingMore,
      hasMore,
      searchInput,
      duration,
      weekCount,
      anchorDate,
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
