import { buildFilterConditions } from "@/utils/filters";
import type { ProjectListFilters } from "./types";

/** The page's filters as Frappe filters on Project, as the React page sent them. */
export function buildProjectFilters(filters: ProjectListFilters): unknown[][] {
  return [
    ...(filters.ragStatus.length
      ? [["custom_project_rag_status", "in", filters.ragStatus.join(",")]]
      : []),
    ...(filters.phase ? [["custom_project_phase", "=", filters.phase]] : []),
    ...(filters.status ? [["status", "=", filters.status]] : []),
    ...buildFilterConditions(filters.advanced),
  ];
}
