/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeDeleteDoc,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RISK_DETAIL_PARAM, RISK_STATUSES, type RiskStatus } from "./constants";
import { RisksContext, type RisksContextProps } from "./context";
import type { RiskFilters, RiskSort, RiskVisibleColumns } from "./types";
import { useRisksData } from "./useRisksData";

const defaultFilters: RiskFilters = {
  owner: "",
  status: "",
  riskLevel: "",
  advanced: [],
};

const defaultVisibleColumns: RiskVisibleColumns = Object.fromEntries(
  RISK_STATUSES.map((s) => [s, true]),
) as unknown as RiskVisibleColumns;

export function RisksProvider({ children }: PropsWithChildren) {
  const [filters, setFiltersState] = useState<RiskFilters>(defaultFilters);
  const [visibleColumns, setVisibleColumnsState] = useState<RiskVisibleColumns>(
    defaultVisibleColumns,
  );
  const [isCreateRiskOpen, setIsCreateRiskOpen] = useState(false);
  const [editRiskName, setEditRiskName] = useState<string | null>(null);
  const [createRiskInitialStatus, setCreateRiskInitialStatus] = useState<
    RiskStatus | ""
  >("");
  const [deleteRiskName, setDeleteRiskName] = useState<string | null>(null);
  const [sort, setSortState] = useState<RiskSort | null>(null);
  const [, setSearchParams] = useSearchParams();
  const { mutate } = useSWRConfig();

  const {
    data,
    isLoading,
    error,
    mutate: refreshRiskList,
    allOwnersWithDetails,
  } = useRisksData(filters, sort);

  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();

  const setFilters = useCallback((partial: Partial<RiskFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setVisibleColumns = useCallback(
    (partial: Partial<RiskVisibleColumns>) => {
      setVisibleColumnsState((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  const setSort = useCallback((s: RiskSort | null) => {
    setSortState(s);
    mutate(
      (key) =>
        typeof key === "string" &&
        key.includes("/api/resource/Risk?") &&
        key.includes("order_by="),
      undefined,
      { revalidate: true },
    );
  }, []);

  const updateRiskStatus = useCallback(
    async (name: string, status: RiskStatus) => {
      await updateDoc("Risk", name, { status });
      void refreshRiskList();
    },
    [updateDoc, refreshRiskList],
  );

  const openCreateRisk = useCallback(() => {
    setEditRiskName(null);
    setCreateRiskInitialStatus("");
    setIsCreateRiskOpen(true);
  }, []);

  const closeCreateRisk = useCallback(() => {
    setIsCreateRiskOpen(false);
    setEditRiskName(null);
    setCreateRiskInitialStatus("");
  }, []);

  const openEditRisk = useCallback((name: string) => {
    setEditRiskName(name);
    setCreateRiskInitialStatus("");
    setIsCreateRiskOpen(true);
  }, []);

  const openCreateRiskWithStatus = useCallback((status: RiskStatus) => {
    setEditRiskName(null);
    setCreateRiskInitialStatus(status);
    setIsCreateRiskOpen(true);
  }, []);

  const openDeleteRisk = useCallback((name: string) => {
    setDeleteRiskName(name);
  }, []);

  const closeDeleteRisk = useCallback(() => {
    setDeleteRiskName(null);
  }, []);

  const deleteRisk = useCallback(
    async (name: string) => {
      try {
        await deleteDoc("Risk", name);
        setSearchParams((prev) => {
          prev.delete(RISK_DETAIL_PARAM);
          return prev;
        });
        void refreshRiskList();
        toast.success("Risk deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, setSearchParams, refreshRiskList, toast],
  );

  const refreshRisks = useCallback(() => {
    void refreshRiskList();
  }, [refreshRiskList]);

  const openRiskDetail = useCallback(
    (name: string) => {
      setSearchParams((prev) => {
        prev.set(RISK_DETAIL_PARAM, name);
        return prev;
      });
    },
    [setSearchParams],
  );

  const value = useMemo<RisksContextProps>(
    () => ({
      state: {
        data: data ?? [],
        isLoading,
        error,
        filters,
        visibleColumns,
        sort,
        isCreateRiskOpen,
        editRiskName,
        createRiskInitialStatus,
        deleteRiskName,
        allOwnersWithDetails,
      },
      actions: {
        setFilters,
        setVisibleColumns,
        setSort,
        updateRiskStatus,
        openCreateRisk,
        closeCreateRisk,
        refreshRisks,
        openRiskDetail,
        openEditRisk,
        openCreateRiskWithStatus,
        openDeleteRisk,
        closeDeleteRisk,
        deleteRisk,
      },
    }),
    [
      data,
      isLoading,
      error,
      filters,
      visibleColumns,
      sort,
      isCreateRiskOpen,
      editRiskName,
      createRiskInitialStatus,
      deleteRiskName,
      allOwnersWithDetails,
      setFilters,
      setVisibleColumns,
      setSort,
      updateRiskStatus,
      openCreateRisk,
      closeCreateRisk,
      refreshRisks,
      openRiskDetail,
      openEditRisk,
      openCreateRiskWithStatus,
      openDeleteRisk,
      closeDeleteRisk,
      deleteRisk,
    ],
  );

  return (
    <RisksContext.Provider value={value}>{children}</RisksContext.Provider>
  );
}
