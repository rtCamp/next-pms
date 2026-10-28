import { toValue, type MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface ProjectItem {
  name: string;
  project_name: string;
  customer?: string | null;
}

/** A project option; `customer` is the project's Customer id. */
export interface ProjectLookupOption extends LookupOption {
  customer?: string;
}

export interface ProjectLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<ProjectLookupOption | null | undefined>;
  /** frappe-ui class icon put on every option, e.g. `"lucide-folder"`. */
  icon?: string;
  /** Server-side filters added to the search, as `[field, operator, value]`. */
  filters?: unknown[][];
  /**
   * Searches with `get_projects`, limited to the projects shared with this employee once
   * one is set. Pass it, even as an empty getter, to use that method.
   */
  employeeId?: MaybeRefOrGetter<string | null | undefined>;
}

/**
 * Searches projects by id or name for project pickers. Applies the boot's
 * `global_filters.project`, which limits a contractor to the projects shared with them.
 * With `employeeId`, searches `get_projects` instead, which applies that filter itself
 * and keeps the projects shared with the employee.
 */
export function useProjectLookup(options: ProjectLookupOptions) {
  const employeeId = () => toValue(options.employeeId) || undefined;
  const fields = JSON.stringify(["name", "project_name", "customer"]);
  return useRemoteLookup<
    ProjectItem[] | { data?: ProjectItem[] } | null,
    ProjectItem,
    ProjectLookupOption
  >({
    method: options.employeeId
      ? "next_pms.timesheet.api.project.get_projects"
      : "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => {
      const orFilters = query
        ? JSON.stringify([
            ["Project", "name", "like", `%${query}%`],
            ["Project", "project_name", "like", `%${query}%`],
          ])
        : undefined;
      if (options.employeeId) {
        return {
          employee: employeeId(),
          fields,
          filters: options.filters
            ? JSON.stringify(options.filters)
            : undefined,
          or_filters: orFilters,
          limit: 20,
          start: 0,
        };
      }
      return {
        doctype: "Project",
        fields,
        filters: JSON.stringify([
          ...(window.boot?.global_filters?.project ?? []),
          ...(options.filters ?? []),
        ]),
        or_filters: orFilters,
        limit_page_length: 20,
      };
    },
    refetchOn: employeeId,
    getItems: (response) =>
      (Array.isArray(response) ? response : response?.data) ?? [],
    toOption: (project) => ({
      label: project.project_name,
      value: project.name,
      icon: options.icon,
      customer: project.customer ?? undefined,
    }),
  });
}
