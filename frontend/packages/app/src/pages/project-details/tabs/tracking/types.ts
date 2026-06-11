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
  startDate: string;
  endDate: string;
  hoursBought: string;
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
