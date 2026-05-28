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
  const [, setSearchParams] = useSearchParams();

  const { data, isLoading, error, mutate } = useRisksData();

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
      void mutate();
    },
    [updateDoc, mutate],
  );

  const openCreateRisk = useCallback(() => {
    // TODO: implement create risk modal
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be used when implementing row actions
  const openRowActions = useCallback((_name: string) => {
    // TODO: implement row actions
  }, []);

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
      },
      actions: {
        setFilters,
        setVisibleColumns,
        updateRiskStatus,
        openCreateRisk,
        openRowActions,
        openRiskDetail,
      },
    }),
    [
      data,
      isLoading,
      error,
      filters,
      visibleColumns,
      setFilters,
      setVisibleColumns,
      updateRiskStatus,
      openCreateRisk,
      openRowActions,
      openRiskDetail,
    ],
  );

  return (
    <RisksContext.Provider value={value}>{children}</RisksContext.Provider>
  );
}
