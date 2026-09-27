/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";

/**
 * Internal dependencies.
 */
import { DEFAULT_GROWTH_FILTERS } from "./constants";
import { GrowthContext, type GrowthContextProps } from "./context";
import type { GrowthFilters, GrowthSort } from "./types";
import { useGrowthData } from "./useGrowthData";

export function GrowthProvider({ children }: PropsWithChildren) {
  const [filters, setFiltersState] = useState<GrowthFilters>(
    DEFAULT_GROWTH_FILTERS,
  );
  const [sort, setSort] = useState<GrowthSort | null>(null);

  const {
    data,
    isLoading,
    error,
    mutate,
    activityOwnersWithDetails,
    ideationOwnersWithDetails,
  } = useGrowthData(filters, sort);

  const setFilters = useCallback((partial: Partial<GrowthFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  const value = useMemo<GrowthContextProps>(
    () => ({
      state: {
        data,
        isLoading,
        error,
        filters,
        sort,
        activityOwnersWithDetails,
        ideationOwnersWithDetails,
      },
      actions: { setFilters, setSort, refresh },
    }),
    [
      data,
      isLoading,
      error,
      filters,
      sort,
      activityOwnersWithDetails,
      ideationOwnersWithDetails,
      setFilters,
      refresh,
    ],
  );

  return (
    <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>
  );
}
