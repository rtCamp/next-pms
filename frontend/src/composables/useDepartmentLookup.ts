import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface DepartmentItem {
  name: string;
}

export interface DepartmentLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/** Searches departments that aren't groups, by name. */
export function useDepartmentLookup(options: DepartmentLookupOptions) {
  return useRemoteLookup<DepartmentItem[] | null, DepartmentItem>({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      doctype: "Department",
      fields: JSON.stringify(["name"]),
      filters: JSON.stringify([
        ["is_group", "=", 0],
        ...(query ? [["name", "like", `%${query}%`]] : []),
      ]),
      limit_page_length: 20,
    }),
    getItems: (response) => response ?? [],
    toOption: (department) => ({
      label: department.name,
      value: department.name,
    }),
  });
}
