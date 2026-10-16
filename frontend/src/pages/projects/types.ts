import type { FilterCondition } from "@/components/Filter";

export type RagStatus = "red" | "amber" | "green";

export type ProjectStatus = "Open" | "Completed" | "Cancelled";

export interface ProjectListFilters {
  search: string;
  ragStatus: RagStatus[];
  /** A Project Phase name, or `""` for all phases. */
  phase: string;
  status: ProjectStatus | "";
  advanced: FilterCondition[];
  currency: string;
}

export interface ProjectListColumn {
  key: string;
  label: string;
  /** CSS width of the column, e.g. `"240px"`. */
  width: string;
  sortField?: string;
  /** Left out of the default layout; users add it back with the column selector. */
  defaultHidden?: boolean;
}

/** A person shown in a project row or card. */
export interface ProjectPerson {
  user: string;
  full_name: string;
  image: string | null;
}

export interface CostBurn {
  cost_accrued: number;
  cost_forecasted: number;
  target_cost: number;
  total_budget: number;
}

export interface ProjectListItem {
  name: string;
  project_name: string;
  customer: string | null;
  customer_name: string | null;
  status: string;
  rag_status?: string | null;
  phase: string | null;
  billing_type: string | null;
  currency: string;
  project_type: string | null;
  burn_rate_per_week: number | null;
  cost_burn: CostBurn;
  total_budget: number | null;
  profit_margin: number | null;
  start_date: string | null;
  next_milestone: string | null;
  end_date: string | null;
  contract_end_date: string | null;
  project_manager: ProjectPerson | null;
  engineering_manager: ProjectPerson | null;
  lifetime_value_to_date: number | null;
  client_poc_name: string | null;
}

export interface ProjectListResponse {
  data: ProjectListItem[];
  total_count: number;
  has_more: boolean;
}

export interface KanbanProjectItem {
  name: string;
  project_name: string;
  rag_status?: string | null;
  start_date: string | null;
  end_date: string | null;
  project_manager: ProjectPerson | null;
  engineering_manager: ProjectPerson | null;
  billing_type: string | null;
}

export interface ProjectKanbanResponse {
  /** Projects keyed by their phase name. */
  data: Record<string, KanbanProjectItem[]>;
  total_count: number;
}
