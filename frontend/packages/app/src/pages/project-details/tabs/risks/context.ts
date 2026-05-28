/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { RISK_STATUSES, type RiskStatus } from "./constants";
import type { RiskFilters, RiskItem, RiskVisibleColumns } from "./types";

export interface RisksContextProps {
  state: {
    data: RiskItem[];
    isLoading: boolean;
    error: unknown;
    filters: RiskFilters;
    visibleColumns: RiskVisibleColumns;
  };
  actions: {
    setFilters: (filters: Partial<RiskFilters>) => void;
    setVisibleColumns: (cols: Partial<RiskVisibleColumns>) => void;
    updateRiskStatus: (name: string, status: RiskStatus) => Promise<void>;
    openCreateRisk: () => void;
    openRowActions: (name: string) => void;
  };
}

const noop = () => {};

const defaultVisibleColumns: RiskVisibleColumns = Object.fromEntries(
  RISK_STATUSES.map((s) => [s, true]),
) as unknown as RiskVisibleColumns;

export const RisksContext = createContext<RisksContextProps>({
  state: {
    data: [],
    isLoading: false,
    error: null,
    filters: {
      owner: "",
      status: "",
      riskLevel: "",
      advanced: [],
    },
    visibleColumns: defaultVisibleColumns,
  },
  actions: {
    setFilters: noop,
    setVisibleColumns: noop,
    updateRiskStatus: async () => {},
    openCreateRisk: noop,
    openRowActions: noop,
  },
});

export const useRisks = <T>(selector: (state: RisksContextProps) => T) =>
  useContextSelector(RisksContext, selector);
