import type { RiskLevel } from "./cells/dot";

export type ListViewColumn = { key: string; label: string; width?: string };

export type Phase =
  | "Delivery Prep"
  | "Kick Off"
  | "Discovery"
  | "Development"
  | "Launch"
  | "Close Out";

export type ProjectType = "Fixed cost" | "Retainer" | "External";

export type Employee = {
  user: string;
  full_name: string;
  image: string | null;
};

export type CostBurn = {
  cost_accrued: number;
  cost_forecasted: number;
  target_cost: number;
  total_budget: number;
};

export type ProjectListItem = {
  name: string;
  project_name: string;
  customer: string | null;
  customer_name: string | null;
  status: string;
  rag_status: RiskLevel;
  phase: Phase;
  billing_type: string;
  currency: string;
  project_type: ProjectType | null;
  burn_rate_per_week: number | null;
  cost_burn: CostBurn;
  total_budget: number;
  profit_margin: number;
  start_date: string | null;
  next_milestone: string | null;
  end_date: string | null;
  contract_end_date: string | null;
  project_manager: Employee | null;
  engineering_manager: Employee | null;
};

export type ResponseProject = {
  message: {
    data: ProjectListItem[];
    total_count: number;
    has_more: boolean;
  };
};
