import type { ClientPriority } from "@/pages/project-details/tabs/growth/types";
import type { UserDetails } from "@/pages/project-details/types";

export type PipelineView = "board" | "list";

export type PipelineSort = "modified" | "converted_outcome" | "activity";

export interface PipelineInitiative {
  name: string;
  activity: string;
  customer: string | null;
  project: string | null;
  project_name: string | null;
  status: string;
  closed_status: string | null;
  is_closed: 0 | 1;
  client_priority: ClientPriority | null;
  category: string | null;
  activity_owner: string | null;
  project_manager: string | null;
  billable_outcome: number;
  currency: string;
  converted_outcome: number;
  modified: string;
  can_write: boolean;
}

export interface PipelineClient {
  customer_name: string;
  hourly_rate: number | null;
}

export interface PipelineResponse {
  currency: string;
  initiatives: PipelineInitiative[];
  clients: Record<string, PipelineClient>;
}

export interface PipelineFilters {
  search: string;
  customer: string;
  activityOwner: string;
  projectManager: string;
  category: string;
  clientPriority: string;
  status: string;
}

export interface PendingMove {
  initiative: PipelineInitiative;
  status: string;
  closedStatus: string | null;
}

export type UsersByEmail = Record<string, UserDetails | undefined>;
