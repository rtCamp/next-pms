/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import { useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { RISK_DETAIL_PARAM, RISK_STATUSES, type RiskStatus } from "./constants";
import { RisksContext, type RisksContextProps } from "./context";
import type { RiskFilters, RiskVisibleColumns } from "./types";
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
  const [, setSearchParams] = useSearchParams();

  const { data, isLoading, error, mutate: refreshRiskList } = useRisksData();

  const { updateDoc } = useFrappeUpdateDoc();

  const setFilters = useCallback((partial: Partial<RiskFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setVisibleColumns = useCallback(
    (partial: Partial<RiskVisibleColumns>) => {
      setVisibleColumnsState((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

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
        isCreateRiskOpen,
        editRiskName,
        createRiskInitialStatus,
        deleteRiskName,
      },
      actions: {
        setFilters,
        setVisibleColumns,
        updateRiskStatus,
        openCreateRisk,
        closeCreateRisk,
        refreshRisks,
        openRiskDetail,
        openEditRisk,
        openCreateRiskWithStatus,
        openDeleteRisk,
        closeDeleteRisk,
      },
    }),
    [
      data,
      isLoading,
      error,
      filters,
      visibleColumns,
      isCreateRiskOpen,
      editRiskName,
      createRiskInitialStatus,
      deleteRiskName,
      setFilters,
      setVisibleColumns,
      updateRiskStatus,
      openCreateRisk,
      closeCreateRisk,
      refreshRisks,
      openRiskDetail,
      openEditRisk,
      openCreateRiskWithStatus,
      openDeleteRisk,
      closeDeleteRisk,
    ],
  );

  return (
    <RisksContext.Provider value={value}>{children}</RisksContext.Provider>
  );
}
