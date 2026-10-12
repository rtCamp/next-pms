import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface ProjectItem {
  name: string;
  project_name: string;
  customer?: string;
}

export interface ProjectLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
  /** frappe-ui class icon put on every option, e.g. `"lucide-folder"`. */
  icon?: string;
}

/**
 * Searches projects by id or name for project pickers. Applies the boot's
 * `global_filters.project`, which limits a contractor to the projects shared with them.
 */
export function useProjectLookup(options: ProjectLookupOptions) {
  return useRemoteLookup<ProjectItem[], ProjectItem>({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      doctype: "Project",
      fields: JSON.stringify(["name", "project_name", "customer"]),
      filters: JSON.stringify(window.boot?.global_filters?.project ?? []),
      or_filters: query
        ? JSON.stringify([
            ["Project", "name", "like", `%${query}%`],
            ["Project", "project_name", "like", `%${query}%`],
          ])
        : undefined,
      limit_page_length: 20,
    }),
    getItems: (response) => response ?? [],
    toOption: (project) => ({
      label: project.project_name,
      value: project.name,
      icon: options.icon,
    }),
  });
}
