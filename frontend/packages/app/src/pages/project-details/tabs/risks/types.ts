import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import type { RiskStatus } from "./constants";

export interface UserDetails {
  name: string;
  full_name: string;
  user_image: string | null;
}

export interface Follower {
  user: string;
  full_name: string | null;
  user_image: string | null;
}

export interface FileAttachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
}

export interface ApiRiskItem {
  name: string;
  project: string;
  risk_category: string | null;
  risk_level: string | null;
  status: RiskStatus | null;
  summary: string | null;
  owner: string;
}

export interface RiskItem extends ApiRiskItem {
  owner_details?: UserDetails | null;
}

export interface RiskUpdateEntry {
  name: string;
  updated_by: string;
  updated_at: string;
  risk_level: string | null;
  status: string | null;
  note: string | null;
  creation: string;
  idx: number;
}

export interface EnrichedRiskUpdateEntry extends RiskUpdateEntry {
  updated_by_details?: UserDetails | null;
}

export interface ApiRiskDetail extends ApiRiskItem {
  modified: string;
  mitigation_plan: string | null;
  risk_update_log: RiskUpdateEntry[];
}

export interface RiskDetail extends ApiRiskDetail {
  owner_details?: UserDetails | null;
  risk_update_log: EnrichedRiskUpdateEntry[];
}

// UI State

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

export interface RiskSort {
  field: string;
  order: "asc" | "desc";
}
