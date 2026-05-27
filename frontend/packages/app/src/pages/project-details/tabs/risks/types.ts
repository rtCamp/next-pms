import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import type { RiskStatus } from "./constants";

export interface RiskItem {
  name: string;
  project: string;
  risk_category: string | null;
  risk_level: string | null;
  status: RiskStatus | null;
  summary: string | null;
  owner: string | null;
}

export interface RiskFilters {
  owner: string;
  status: RiskStatus | "";
  riskLevel: string;
  advanced: FilterCondition[];
}

export interface RiskVisibleColumns {
  "To-do": boolean;
  "In Progress": boolean;
  Escalated: boolean;
  Blocked: boolean;
  Mitigated: boolean;
}
