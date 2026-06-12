export type CreateRateInput = {
  employee?: string;
  hourlyRate: number;
  validFrom: string;
};

export type EditRateInput = {
  name: string;
  employee: string;
  hourlyRate: number;
  validFrom: string;
};

export type CreateContractInput = {
  startDate: string;
  endDate: string;
  hoursBought: number;
  salesOrder?: string;
  salesInvoice?: string;
};

export type EditContractInput = {
  name: string;
  startDate: string;
  endDate: string;
  hoursBought: number;
  salesOrder?: string;
  salesInvoice?: string;
};

export type ProjectFlatRate = {
  flat_rate_hourly?: number;
  flat_rate_valid_from?: string;
};

export type ProjectRate = {
  name?: string | null;
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
  name: string;
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
export type KpiValue = {
  value: string;
};

export type HoursUsage = {
  hoursUtililized: number;
  hoursTotal: number;
};

export type TaskCompletion = {
  totalIssuesCreated: number;
  issuesOpen: number;
  issuesClosed: number;
};

export type Invoicing = {
  totalAmount: number;
  invoicedPaid: number;
  invoicedUnpaid: number;
};

export type CostBurn = {
  costIncured: number;
  costForcasted: number;
  costTotal: number;
};

export type ContractRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  hoursBought: string;
  hoursBoughtRaw: number;
  hoursUsed: string;
  hoursLeft: string;
  salesOrder: string;
  salesInvoice: string;
};

export type RateRow = {
  id: string;
  name: string;
  employee: string;
  employeeName: string;
  image?: string;
  rateLabel: string;
  amount: string;
  hourlyRate: number;
  date: string;
};

export type TrackingData = {
  company: KpiValue;
  totalProjectValue: KpiValue;
  projectProfit: KpiValue;
  projectedProfitMargin: KpiValue;
  lifetimeValueToDate: KpiValue;
  expectedLifetimeValue: KpiValue;
  lifetimeValueVsBilledAmount: KpiValue;
  hoursUsage: HoursUsage;
  taskCompletion: TaskCompletion;
  invoicing: Invoicing;
  costBurn: CostBurn;
  contracts: ContractRow[];
  flatRate: { amount: string; date: string };
  rates: RateRow[];
};
