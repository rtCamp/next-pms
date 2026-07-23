import type { FilterCondition } from "@rtcamp/frappe-ui-react";

import { PHASES, RAG_STATUS } from "./constants";

export type ListViewColumn = { key: string; label: string; width?: string };

export type Phase = (typeof PHASES)[number];

export type RagStatus = (typeof RAG_STATUS)[number];

export type ProjectStatus = "Open" | "Completed" | "Cancelled";

export type ProjectType = "Fixed cost" | "Retainer" | "External";

export interface ProjectListFilters {
  search: string;
  ragStatus: RagStatus[];
  phase: Phase | "";
  status: ProjectStatus | "";
  advanced: FilterCondition[];
}
