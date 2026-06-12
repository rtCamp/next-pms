/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type {
  ContractRow,
  RateRow,
  Tracking,
  CreateRateInput,
  EditRateInput,
  CreateContractInput,
  EditContractInput,
} from "./types";

export interface TrackingContextProps {
  tracking: Tracking;
  contracts: ContractRow[] | null;
  rates: RateRow[] | null;
  flatRate: { amount: string; date: string } | undefined;
  deleteRate: (name: string) => Promise<void>;
  createRate: (input: CreateRateInput) => Promise<void>;
  editRate: (input: EditRateInput) => Promise<void>;
  editingRate: RateRow | null;
  setEditingRate: (row: RateRow | null) => void;
  addRateModalOpen: boolean;
  setAddRateModalOpen: (open: boolean) => void;
  createContract: (input: CreateContractInput) => Promise<void>;
  editContract: (input: EditContractInput) => Promise<void>;
  deleteContract: (name: string) => Promise<void>;
  editingContract: ContractRow | null;
  setEditingContract: (row: ContractRow | null) => void;
  addContractModalOpen: boolean;
  setAddContractModalOpen: (open: boolean) => void;
}

export const DEFAULT_TRACKING: Tracking = {
  company: "",
  billing_type: "",
  currency: "INR",
  total_project_value: 0,
  project_profit: 0,
  projected_profit_margin: 0,
  actual_cost_incurred: 0,
  forecasted_cost_to_completion: 0,
  expected_total_cost: 0,
  hours_utilised: 0,
  hours_remaining: null,
  tasks: { total: 0, open: 0, completed: 0 },
  invoice_burn: {
    currency: "INR",
    invoiced_and_paid: 0,
    invoiced_but_not_paid: 0,
    total_project_amount: 0,
  },
  contracts: null,
  project_rates: null,
  lifetime_value_to_date: 0,
  expected_lifetime_value: 0,
  lifetime_value_vs_billed_amount: 0,
};

export const TrackingContext = createContext<TrackingContextProps>({
  tracking: DEFAULT_TRACKING,
  contracts: [],
  rates: [],
  flatRate: undefined,
  deleteRate: async () => {},
  createRate: async () => {},
  editRate: async () => {},
  editingRate: null,
  setEditingRate: () => {},
  addRateModalOpen: false,
  setAddRateModalOpen: () => {},
  createContract: async () => {},
  editContract: async () => {},
  deleteContract: async () => {},
  editingContract: null,
  setEditingContract: () => {},
  addContractModalOpen: false,
  setAddContractModalOpen: () => {},
});

export const useTracking = <T>(selector: (state: TrackingContextProps) => T) =>
  useContextSelector(TrackingContext, selector);
