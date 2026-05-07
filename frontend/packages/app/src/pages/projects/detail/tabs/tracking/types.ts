export type HoursUsageData = {
  utilised: number;
  total: number;
};

export type TaskCompletionData = {
  totalIssues: number;
  openIssues: number;
  completedIssues: number;
};

export type CostBurnData = {
  actual: number;
  forecasted: number;
  total: number;
};

export type InvoiceBurnData = {
  paid: number;
  unpaid: number;
  total: number;
};

export type TrackingData = {
  company: string;
  totalProjectValue: string;
  projectProfit: string;
  projectedProfitMargin: string;
  lifetimeValueToDate: string;
  expectedLifetimeValue: string;
  lifetimeValueVsBilledAmount: string;
  hoursUsage: HoursUsageData;
  taskCompletion: TaskCompletionData;
  costBurn: CostBurnData;
  invoiceBurn: InvoiceBurnData;
};
