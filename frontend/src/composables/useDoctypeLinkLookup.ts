import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

type LinkItem = Record<string, unknown> & { name: string };

export interface DoctypeLinkLookupOptions {
  doctype: string;
  /** Field shown as the option label. Default: `"name"`. */
  labelField?: string;
  /** Field stored as the value. Default: `"name"`. */
  valueField?: string;
  /** Server-side filters added to the search, as `[field, operator, value]`. */
  filters?: unknown[][];
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/**
 * Searches one doctype by its label field with `frappe.client.get_list`, sorted by
 * label, for link-style filter inputs such as the task list's project filter.
 */
export function useDoctypeLinkLookup(options: DoctypeLinkLookupOptions) {
  const labelField = options.labelField ?? "name";
  const valueField = options.valueField ?? "name";
  const fields =
    labelField === "name" || labelField === valueField
      ? [valueField]
      : [valueField, labelField];

  return useRemoteLookup<LinkItem[], LinkItem>({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      doctype: options.doctype,
      fields: JSON.stringify(fields),
      limit_page_length: 20,
      order_by: `${labelField} asc`,
      filters: JSON.stringify([
        ...(options.filters ?? []),
        ...(query ? [[labelField, "like", `%${query}%`]] : []),
      ]),
    }),
    getItems: (response) => response ?? [],
    toOption: (item) => ({
      label: String(item[labelField] ?? item[valueField]),
      value: String(item[valueField]),
    }),
  });
}
