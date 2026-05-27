/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import { RISK_STATUSES, type RiskStatus } from "./constants";
import { RisksContext, type RisksContextProps } from "./context";
import type { RiskFilters, RiskItem, RiskVisibleColumns } from "./types";

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
  const projectId = useProjectDetail((s) => s.projectId);
  const [filters, setFiltersState] = useState<RiskFilters>(defaultFilters);
  const [visibleColumns, setVisibleColumnsState] = useState<RiskVisibleColumns>(
    defaultVisibleColumns,
  );

  const frappeFilters = useMemo(() => {
    const base: unknown[] = [["project", "=", projectId]];
    // TODO: Add more filters
    return base;
  }, [projectId]);

  const { data, isLoading, error, mutate } = useFrappeGetDocList<RiskItem>(
    "Risk",
    {
      fields: [
        "name",
        "project",
        "risk_category",
        "risk_level",
        "status",
        "summary",
        "owner",
      ],
      filters: frappeFilters as never,
      limit: 500,
    },
  );

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
    ],
  );

  return (
    <RisksContext.Provider value={value}>{children}</RisksContext.Provider>
  );
}
