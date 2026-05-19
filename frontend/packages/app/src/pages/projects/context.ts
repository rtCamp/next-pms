/**
 * External dependencies.
 */
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Phase } from "./types";

export type RagStatus = "red" | "amber" | "green";
export type ProjectStatus = "Open" | "Completed" | "Cancelled";

export interface ProjectListFilters {
  search: string;
  ragStatus: RagStatus | "";
  phase: Phase | "";
  status: ProjectStatus | "";
  advanced: FilterCondition[];
}

export const buildListFrappeFilters = (filters: ProjectListFilters) => {
  const out: unknown[] = [];
  if (filters.ragStatus) {
    out.push(["custom_project_rag_status", "=", filters.ragStatus]);
  }
  if (filters.phase) {
    out.push(["custom_project_phase", "=", filters.phase]);
  }
  if (filters.status) {
    out.push(["status", "=", filters.status]);
  }
  return out;
};
