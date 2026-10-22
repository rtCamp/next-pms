/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useSearchParams } from "react-router";

/**
 * Internal dependencies.
 */
import { DEFAULT_GROWTH_FILTERS, GROWTH_DETAIL_PARAM } from "./constants";
import { GrowthContext, type GrowthContextProps } from "./context";
import type { GrowthFilters, GrowthSort } from "./types";
import { useGrowthData } from "./useGrowthData";
import { useGrowthDialogs } from "./useGrowthDialogs";
import { useGrowthMasters } from "./useGrowthMasters";

export function GrowthProvider({ children }: PropsWithChildren) {
  const [filters, setFiltersState] = useState<GrowthFilters>(
    DEFAULT_GROWTH_FILTERS,
  );
  const [sort, setSort] = useState<GrowthSort | null>(null);
  const [, setSearchParams] = useSearchParams();

  const {
    data,
    isLoading,
    error,
    mutate,
    activityOwnersWithDetails,
    projectManagersWithDetails,
  } = useGrowthData(filters, sort);
  const masters = useGrowthMasters();

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);
  const dialogs = useGrowthDialogs(refresh);

  const setFilters = useCallback((partial: Partial<GrowthFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const openDetail = useCallback(
    (name: string) => {
      setSearchParams((prev) => {
        prev.set(GROWTH_DETAIL_PARAM, name);
        return prev;
      });
    },
    [setSearchParams],
  );

  const value = useMemo<GrowthContextProps>(
    () => ({
      state: {
        data,
        isLoading,
        error,
        filters,
        sort,
        activityOwnersWithDetails,
        projectManagersWithDetails,
        isCreateOpen: dialogs.isCreateOpen,
        createStatus: dialogs.createStatus,
        editName: dialogs.editName,
        deleteName: dialogs.deleteName,
        ...masters,
      },
      actions: {
        setFilters,
        setSort,
        refresh,
        openCreate: dialogs.openCreate,
        closeCreate: dialogs.closeCreate,
        openEdit: dialogs.openEdit,
        openDetail,
        openDelete: dialogs.openDelete,
        closeDelete: dialogs.closeDelete,
        deleteGrowth: dialogs.deleteGrowth,
      },
    }),
    [
      data,
      isLoading,
      error,
      filters,
      sort,
      activityOwnersWithDetails,
      projectManagersWithDetails,
      dialogs,
      masters,
      setFilters,
      refresh,
      openDetail,
    ],
  );

  return (
    <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>
  );
}
