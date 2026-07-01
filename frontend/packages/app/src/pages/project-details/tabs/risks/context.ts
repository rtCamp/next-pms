/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { RiskFilters, RiskItem, RiskSort, UserDetails } from "./types";

export interface RisksContextProps {
  state: {
    data: RiskItem[];
    isLoading: boolean;
    error: unknown;
    filters: RiskFilters;
    sort: RiskSort | null;
    isCreateRiskOpen: boolean;
    editRiskName: string | null;
    deleteRiskName: string | null;
    allOwnersWithDetails: Record<string, UserDetails | undefined>;
  };
  actions: {
    setFilters: (filters: Partial<RiskFilters>) => void;
    setSort: (sort: RiskSort | null) => void;
    openCreateRisk: () => void;
    closeCreateRisk: () => void;
    refreshRisks: () => void;
    openRiskDetail: (name: string) => void;
    openEditRisk: (name: string) => void;
    openDeleteRisk: (name: string) => void;
    closeDeleteRisk: () => void;
    deleteRisk: (name: string) => Promise<void>;
  };
}

const noop = () => {};

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
    sort: null,
    isCreateRiskOpen: false,
    editRiskName: null,
    deleteRiskName: null,
    allOwnersWithDetails: {},
  },
  actions: {
    setFilters: noop,
    setSort: noop,
    openCreateRisk: noop,
    closeCreateRisk: noop,
    refreshRisks: noop,
    openRiskDetail: noop,
    openEditRisk: noop,
    openDeleteRisk: noop,
    closeDeleteRisk: noop,
    deleteRisk: async () => {},
  },
});

export const useRisks = <T>(selector: (state: RisksContextProps) => T) =>
  useContextSelector(RisksContext, selector);
