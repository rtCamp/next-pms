/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { ContractRow, RateRow } from "./types";
import type { CreateContractInput, CreateRateInput } from "../../context";

export type ProjectFlatRate = {
  flat_rate_hourly?: number;
  flat_rate_valid_from?: string;
};

export type ProjectRate = {
  name: string;
  employee?: string;
  employee_name?: string;
  hourly_billing_rate?: number;
  valid_from?: string;
};

export type TrackingTasks = {
  total: number;
  open: number;
  completed: number;
};

export type TrackingInvoiceBurn = {
  currency: string;
  invoiced_and_paid: number;
  invoiced_but_not_paid: number;
  total_project_amount: number;
};

export type TrackingContract = {
  start_date: string;
  end_date: string;
  hours_purchased: number;
  consumed_hours: number;
  remaining_hours: number;
  sales_order: string;
  sales_invoice: string;
};

export type TrackingMessage = {
  company: string;
  billing_type: string;
  currency: string;
  total_project_value: number;
  project_profit: number;
  projected_profit_margin: number;
  actual_cost_incurred: number;
  forecasted_cost_to_completion: number;
  expected_total_cost: number;
  hours_utilised: number;
  hours_remaining: number | null;
  tasks: TrackingTasks;
  invoice_burn: TrackingInvoiceBurn;
  contracts: TrackingContract[] | null;
  project_rates: [ProjectFlatRate, ...ProjectRate[]] | null;
  lifetime_value_to_date: number;
  expected_lifetime_value: number;
  lifetime_value_vs_billed_amount: number;
};

export type Response = { message: TrackingMessage };

export type Tracking = TrackingMessage;

export interface TrackingContextProps {
  tracking: Tracking;
  contracts: ContractRow[] | null;
  rates: RateRow[] | null;
  flatRate: { amount: string; date: string } | undefined;
  deleteRate: (name: string) => Promise<void>;
  createRate: (input: CreateRateInput) => Promise<void>;
  addRateModalOpen: boolean;
  setAddRateModalOpen: (open: boolean) => void;
  createContract: (input: CreateContractInput) => Promise<void>;
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
  addRateModalOpen: false,
  setAddRateModalOpen: () => {},
  createContract: async () => {},
  addContractModalOpen: false,
  setAddContractModalOpen: () => {},
});

export const useTracking = <T>(selector: (state: TrackingContextProps) => T) =>
  useContextSelector(TrackingContext, selector);
