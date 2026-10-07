/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useSearchParams } from "react-router";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  useFrappeDeleteDoc,
  useFrappeGetDocList,
  type FrappeError,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import {
  DEFAULT_GROWTH_FILTERS,
  GROWTH_CATEGORY_DOCTYPE,
  GROWTH_DETAIL_PARAM,
  GROWTH_DOCTYPE,
  GROWTH_STATUS_DOCTYPE,
} from "./constants";
import { GrowthContext, type GrowthContextProps } from "./context";
import type {
  GrowthFilters,
  GrowthSort,
  GrowthStatusDoc,
  NamedDoc,
} from "./types";
import { useGrowthData } from "./useGrowthData";

export function GrowthProvider({ children }: PropsWithChildren) {
  const [filters, setFiltersState] = useState<GrowthFilters>(
    DEFAULT_GROWTH_FILTERS,
  );
  const [sort, setSort] = useState<GrowthSort | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();

  const {
    data,
    isLoading,
    error,
    mutate,
    activityOwnersWithDetails,
    ideationOwnersWithDetails,
  } = useGrowthData(filters, sort);

  const { data: allStatuses, isLoading: statusesLoading } =
    useFrappeGetDocList<GrowthStatusDoc>(GROWTH_STATUS_DOCTYPE, {
      fields: ["name", "status_type", "is_closed"],
      orderBy: { field: "name", order: "asc" },
    });
  const statuses = useMemo(
    () => (allStatuses ?? []).filter((s) => s.status_type === "Status"),
    [allStatuses],
  );
  const closedStatuses = useMemo(
    () => (allStatuses ?? []).filter((s) => s.status_type === "Closed Status"),
    [allStatuses],
  );
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

  const openCreate = useCallback(() => {
    setEditName(null);
    setIsCreateOpen(true);
  }, []);
  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
    setEditName(null);
  }, []);
  const openEdit = useCallback((name: string) => {
    setEditName(name);
    setIsCreateOpen(true);
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

  const openDelete = useCallback((name: string) => setDeleteName(name), []);
  const closeDelete = useCallback(() => setDeleteName(null), []);

  const deleteGrowth = useCallback(
    async (name: string) => {
      try {
        await deleteDoc(GROWTH_DOCTYPE, name);
        setSearchParams((prev) => {
          prev.delete(GROWTH_DETAIL_PARAM);
          return prev;
        });
        void mutate();
        toast.success("Growth initiative deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, setSearchParams, mutate, toast],
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
        ideationOwnersWithDetails,
        isCreateOpen,
        editName,
        deleteName,
        statuses,
        closedStatuses,
        categories: categories ?? [],
        isMastersLoading: statusesLoading || categoriesLoading,
      },
      actions: {
        setFilters,
        setSort,
        refresh,
        openCreate,
        closeCreate,
        openEdit,
        openDetail,
        openDelete,
        closeDelete,
        deleteGrowth,
      },
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
      editName,
      deleteName,
      statuses,
      closedStatuses,
      categories,
      statusesLoading,
      categoriesLoading,
      setFilters,
      refresh,
      openCreate,
      closeCreate,
      openEdit,
      openDetail,
      openDelete,
      closeDelete,
      deleteGrowth,
    ],
  );

  return (
    <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>
  );
}
