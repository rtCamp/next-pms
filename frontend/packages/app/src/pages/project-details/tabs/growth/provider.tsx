/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  DEFAULT_GROWTH_FILTERS,
  GROWTH_CATEGORY_DOCTYPE,
  GROWTH_STATUS_DOCTYPE,
} from "./constants";
import { GrowthContext, type GrowthContextProps } from "./context";
import type { GrowthFilters, GrowthSort, NamedDoc } from "./types";
import { useGrowthData } from "./useGrowthData";

export function GrowthProvider({ children }: PropsWithChildren) {
  const [filters, setFiltersState] = useState<GrowthFilters>(
    DEFAULT_GROWTH_FILTERS,
  );
  const [sort, setSort] = useState<GrowthSort | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
    mutate,
    activityOwnersWithDetails,
    ideationOwnersWithDetails,
  } = useGrowthData(filters, sort);

  const { data: statuses, isLoading: statusesLoading } =
    useFrappeGetDocList<NamedDoc>(GROWTH_STATUS_DOCTYPE, {
      fields: ["name"],
      filters: [["status_type", "=", "Status"]],
      orderBy: { field: "name", order: "asc" },
    });
  const { data: categories, isLoading: categoriesLoading } =
    useFrappeGetDocList<NamedDoc>(GROWTH_CATEGORY_DOCTYPE, {
      fields: ["name"],
      orderBy: { field: "name", order: "asc" },
    });

  const setFilters = useCallback((partial: Partial<GrowthFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  const openCreate = useCallback(() => setIsCreateOpen(true), []);
  const closeCreate = useCallback(() => setIsCreateOpen(false), []);

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
        isCreateOpen,
        statuses: statuses ?? [],
        categories: categories ?? [],
        isMastersLoading: statusesLoading || categoriesLoading,
      },
      actions: { setFilters, setSort, refresh, openCreate, closeCreate },
    }),
    [
      data,
      isLoading,
      error,
      filters,
      sort,
      activityOwnersWithDetails,
      ideationOwnersWithDetails,
      isCreateOpen,
      statuses,
      categories,
      statusesLoading,
      categoriesLoading,
      setFilters,
      refresh,
      openCreate,
      closeCreate,
    ],
  );

  return (
    <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>
  );
}
