/**
 * Internal dependencies.
 */
import { isCompleteFilterCondition } from "@/lib/utils";
import type { ProjectListFilters } from "./types";

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
  if (filters.advanced) {
    filters.advanced.forEach((filter) => {
      if (isCompleteFilterCondition(filter)) {
        out.push([filter.field, filter.operator, filter.value]);
      }
    });
  }
  return out;
};
