/**
 * Internal dependencies.
 */
import {
  isCompleteFilterCondition,
  normalizeLikeFilterValue,
} from "@/lib/utils";
import type { ProjectListFilters } from "./types";

export const buildListFrappeFilters = (filters: ProjectListFilters) => {
  const out: unknown[] = [];
  if (filters.ragStatus && filters.ragStatus.length > 0) {
    out.push(["custom_project_rag_status", "in", filters.ragStatus.join(",")]);
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
        out.push([
          filter.field,
          filter.operator,
          normalizeLikeFilterValue(filter.operator, filter.value),
        ]);
      }
    });
  }
  return out;
};
