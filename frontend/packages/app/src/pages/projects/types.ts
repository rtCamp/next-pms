import type { FilterCondition } from "@rtcamp/frappe-ui-react";

import { PHASES, RAG_STATUS } from "./constants";

export type ListViewColumn = { key: string; label: string; width?: string };

export type ProjectListColumn = ListViewColumn & {
  sortField?: string;
  /** Left out of the default layout; users add it back via the column selector. */
  defaultHidden?: boolean;
};

export type Phase = (typeof PHASES)[number];

export type RagStatus = (typeof RAG_STATUS)[number];

export type ProjectStatus = "Open" | "Completed" | "Cancelled";

export interface ProjectListFilters {
  search: string;
  ragStatus: RagStatus[];
  phase: Phase | "";
  status: ProjectStatus | "";
  advanced: FilterCondition[];
  currency: string;
}
