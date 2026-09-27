import type { UserDetails } from "../risks/types";

export interface GrowthListColumn {
  key: string;
  label: string;
  width: string;
  flex: number;
}

export interface ApiGrowthInitiativeItem {
  name: string;
  project: string;
  activity: string;
  category: string | null;
  client_priority: "" | "Low" | "Medium" | "High" | null;
  status: string;
  is_closed: 0 | 1;
  closed_status: string | null;
  activity_owner: string | null;
  ideation_owner: string | null;
  modified: string;
}

export interface GrowthInitiativeItem extends ApiGrowthInitiativeItem {
  owner_details?: UserDetails | null;
}

export type UserDetailsMap = Record<string, UserDetails | undefined>;

export interface GrowthFilters {
  activityOwner: string;
  ideationOwner: string;
  status: string;
  category: string;
}

export interface GrowthSort {
  field: string;
  order: "asc" | "desc";
}
