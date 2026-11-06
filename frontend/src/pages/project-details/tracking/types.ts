export interface ProjectFlatRate {
  flat_rate_hourly: number | null;
  flat_rate_valid_from: string | null;
}

export interface ProjectRate {
  name: string;
  employee: string;
  employee_name: string | null;
  image: string | null;
  hourly_billing_rate: number | null;
  valid_from: string | null;
}

export interface TrackingContract {
  name: string;
  start_date: string;
  end_date: string;
  hours_purchased: number;
  consumed_hours: number;
  remaining_hours: number;
  sales_order: string | null;
  sales_invoice: string | null;
}

/** The response of `get_project_tracking`. */
export interface Tracking {
  billing_type: string;
  currency: string | null;
  total_project_value: number | null;
  project_profit: number | null;
  projected_profit_margin: number | null;
  current_project_value: number | null;
  current_profit: number | null;
  current_profit_margin: number | null;
  actual_cost_incurred: number;
  forecasted_cost_to_completion: number;
  expected_total_cost: number;
  hours_utilised: number;
  hours_utilised_billable: number;
  hours_utilised_non_billable: number;
  hours_remaining: number | null;
  tasks: { total: number; open: number; completed: number };
  invoice_burn: {
    currency?: string | null;
    invoiced_and_paid?: number;
    invoiced_but_not_paid?: number;
    total_project_amount: number | null;
  };
  budget_burn: {
    actual: number;
    forecasted: number;
    total_budget: number;
  } | null;
  contracts: TrackingContract[] | null;
  /** The flat rate first, then one row per member rate. */
  project_rates: [ProjectFlatRate, ...ProjectRate[]] | null;
  lifetime_values: {
    lifetime_value_to_date: number | null;
    expected_lifetime_value: number | null;
    lifetime_value_vs_billed_amount: number | null;
  } | null;
}

export type WidgetKey =
  | "financials"
  | "task_completion"
  | "hours_usage"
  | "invoice_burn"
  | "budget_burn"
  | "cost_burn"
  | "lifetime_to_date"
  | "lifetime_expected"
  | "lifetime_vs_billed"
  | "contracts"
  | "rates";

/** `row` when the widget has its row to itself, else `stacked`. */
export type WidgetLayout = "stacked" | "row";

export type TrackingLayout = WidgetKey[][];

/** A saved `PMS View Setting` row holding the project's layout. */
export interface StoredView {
  name: string;
  rows: unknown;
}
