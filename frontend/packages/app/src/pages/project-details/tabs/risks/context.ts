/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { RISK_STATUSES, type RiskStatus } from "./constants";
import type {
  RiskFilters,
  RiskItem,
  RiskSort,
  RiskVisibleColumns,
  UserDetails,
} from "./types";

export interface RisksContextProps {
  state: {
    data: RiskItem[];
    isLoading: boolean;
    error: unknown;
    filters: RiskFilters;
    visibleColumns: RiskVisibleColumns;
    sort: RiskSort | null;
    isCreateRiskOpen: boolean;
    editRiskName: string | null;
    createRiskInitialStatus: RiskStatus | "";
    deleteRiskName: string | null;
    allOwnersWithDetails: Record<string, UserDetails | undefined>;
  };
  actions: {
    setFilters: (filters: Partial<RiskFilters>) => void;
    setVisibleColumns: (cols: Partial<RiskVisibleColumns>) => void;
    setSort: (sort: RiskSort | null) => void;
    updateRiskStatus: (name: string, status: RiskStatus) => Promise<void>;
    openCreateRisk: () => void;
    closeCreateRisk: () => void;
    refreshRisks: () => void;
    openRiskDetail: (name: string) => void;
    openEditRisk: (name: string) => void;
    openCreateRiskWithStatus: (status: RiskStatus) => void;
    openDeleteRisk: (name: string) => void;
    closeDeleteRisk: () => void;
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
    sort: null,
    isCreateRiskOpen: false,
    editRiskName: null,
    createRiskInitialStatus: "",
    deleteRiskName: null,
    allOwnersWithDetails: {},
  },
  actions: {
    setFilters: noop,
    setVisibleColumns: noop,
    setSort: noop,
    updateRiskStatus: async () => {},
    openCreateRisk: noop,
    closeCreateRisk: noop,
    refreshRisks: noop,
    openRiskDetail: noop,
    openEditRisk: noop,
    openCreateRiskWithStatus: noop,
    openDeleteRisk: noop,
    closeDeleteRisk: noop,
  },
});

export const useRisks = <T>(selector: (state: RisksContextProps) => T) =>
  useContextSelector(RisksContext, selector);
