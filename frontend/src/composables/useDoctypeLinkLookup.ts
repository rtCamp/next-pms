import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

type LinkItem = Record<string, unknown> & { name: string };

const PAGE_LENGTH = 20;

export interface DoctypeLinkLookupOptions {
  doctype: string;
  /** Field shown as the option label. Default: `"name"`. */
  labelField?: string;
  /** Field stored as the value. Default: `"name"`. */
  valueField?: string;
  /** Server-side filters added to the search, as `[field, operator, value]`. */
  filters?: unknown[][];
  /**
   * Whitelisted method searched instead of `frappe.client.get_list`, e.g. the employee
   * list. It gets the query as `employee_name` and returns `{ data: [...] }`.
   */
  customMethod?: { method: string; args?: Record<string, unknown> };
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

function toParam(value: unknown): string | number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  return JSON.stringify(value);
}

/**
 * Searches one doctype by its label field with `frappe.client.get_list`, sorted by
 * label, for link-style filter inputs such as the task list's project filter. With
 * `customMethod`, searches that method instead.
 */
export function useDoctypeLinkLookup(options: DoctypeLinkLookupOptions) {
  const labelField = options.labelField ?? "name";
  const valueField = options.valueField ?? "name";
  const fields =
    labelField === "name" || labelField === valueField
      ? [valueField]
      : [valueField, labelField];
  const customMethod =
    options.customMethod?.method &&
    options.customMethod.method !== "frappe.client.get_list"
      ? options.customMethod
      : undefined;

  return useRemoteLookup<LinkItem[] | { data?: LinkItem[] } | null, LinkItem>({
    method: customMethod?.method ?? "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) =>
      customMethod
        ? {
            employee_name: query || undefined,
            page_length: PAGE_LENGTH,
            start: 0,
            filters: toParam(options.filters),
            ...Object.fromEntries(
              Object.entries(customMethod.args ?? {}).map(([key, value]) => [
                key,
                toParam(value),
              ]),
            ),
          }
        : {
            doctype: options.doctype,
            fields: JSON.stringify(fields),
            limit_page_length: PAGE_LENGTH,
            order_by: `${labelField} asc`,
            filters: JSON.stringify([
              ...(options.filters ?? []),
              ...(query ? [[labelField, "like", `%${query}%`]] : []),
            ]),
          },
    getItems: (response) =>
      Array.isArray(response) ? response : (response?.data ?? []),
    toOption: (item) => ({
      label: String(item[labelField] ?? item[valueField]),
      value: String(item[valueField]),
    }),
  });
}
