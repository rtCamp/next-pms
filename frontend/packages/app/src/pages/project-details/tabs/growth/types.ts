import type { UserDetails } from "@/pages/project-details/types";

export type ClientPriority = "" | "Low" | "Medium" | "High";

export interface GrowthListColumn {
  key: string;
  label: string;
  width: string;
  flex: number;
}

export interface ApiGrowthInitiativeItem {
  name: string;
  project: string | null;
  customer: string | null;
  activity: string;
  category: string | null;
  client_priority: ClientPriority | null;
  status: string;
  is_closed: 0 | 1;
  closed_status: string | null;
  activity_owner: string | null;
  project_manager: string | null;
  billable_outcome: number;
  modified: string;
}

export interface GrowthInitiativeItem extends ApiGrowthInitiativeItem {
  owner_details?: UserDetails | null;
  pm_details?: UserDetails | null;
}

export type UserDetailsMap = Record<string, UserDetails | undefined>;

export interface GrowthFilters {
  activityOwner: string;
  projectManager: string;
  status: string;
  category: string;
}

export interface GrowthSort {
  field: string;
  order: "asc" | "desc";
}

export interface NamedDoc {
  name: string;
}

export interface GrowthStatusDoc extends NamedDoc {
  status_type: "Status" | "Closed Status";
  is_closed: 0 | 1;
}

export interface GrowthUpdateEntry {
  name: string;
  idx: number;
  creation: string;
  updated_by: string;
  updated_at: string;
  status: string | null;
  closed_status: string | null;
  client_priority: ClientPriority | null;
  billable_outcome: number | null;
  note: string | null;
}

export interface EnrichedGrowthUpdateEntry extends GrowthUpdateEntry {
  updated_by_details: UserDetails | null;
}

export interface ApiGrowthDetail extends ApiGrowthInitiativeItem {
  ideation_date: string;
  description: string | null;
  desired_outcome: string | null;
  owner: string;
  update_log: GrowthUpdateEntry[];
}

export interface GrowthDetail extends ApiGrowthDetail {
  activity_owner_details: UserDetails | null;
  project_manager_details: UserDetails | null;
  update_log: EnrichedGrowthUpdateEntry[];
}
