import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import type { RiskStatus } from "./constants";

export interface ApiRiskItem {
  name: string;
  project: string;
  risk_category: string | null;
  risk_level: string | null;
  status: RiskStatus | null;
  summary: string | null;
  owner: string | null;
}

export interface RiskItem extends ApiRiskItem {
  owner_details?: UserDetails | null;
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

export interface UserDetails {
  name: string;
  full_name: string;
  user_image: string | null;
}
