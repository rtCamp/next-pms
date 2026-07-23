/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type DoctypeLinkItem = Record<string, unknown> & {
  name: string;
};

interface UseDoctypeLinkLookupOptions {
  /** Target doctype to fetch documents from. */
  doctype: string;
  /** Field on the target doctype to use as the option label. Defaults to `name`. */
  labelField?: string;
  /** Field on the target doctype whose value is stored as the filter value. Defaults to `name`. */
  valueField?: string;
  /** Server-side filters applied to the lookup request. */
  filters?: Array<Array<unknown>>;
  /** Custom API method configuration for the lookup. */
  customMethod?: {
    /** Whitelisted API method. */
    method: string;
    /** Arguments passed to the custom method. */
    args?: Record<string, unknown>;
  };
  /** Controls whether the lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Raw user search text before debounce is applied. */
  query: string;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: LookupOption | null;
}

/**
 * Generic per-doctype lookup for Link-type filter value cells.
 */
export const useDoctypeLinkLookup = ({
  doctype,
  labelField = "name",
  valueField = "name",
  filters,
  customMethod,
  shouldFetch,
  query,
  selectedOption,
}: UseDoctypeLinkLookupOptions) => {
  const isDefaultMethod =
    !customMethod?.method || customMethod.method === "frappe.client.get_list";
  const fields =
    labelField === "name" || labelField === valueField
      ? [valueField]
      : [valueField, labelField];

  const params = isDefaultMethod
    ? ({
        query: searchQuery,
        pageSize,
      }: {
        query: string;
        pageSize: number;
      }) => ({
        doctype,
        fields,
        limit_page_length: pageSize,
        order_by: `${labelField} asc`,
        filters: [
          ...(filters ?? []),
          ...(searchQuery ? [[labelField, "like", `%${searchQuery}%`]] : []),
        ],
      })
    : ({
        query: searchQuery,
        pageSize,
      }: {
        query: string;
        pageSize: number;
      }) => ({
        employee_name: searchQuery || undefined,
        page_length: pageSize,
        start: 0,
        filters: filters ?? undefined,
        ...(customMethod.args ? customMethod.args : {}),
      });

  const getItems = isDefaultMethod
    ? (message: DoctypeLinkItem[] | undefined) => message ?? []
    : (data: { data?: DoctypeLinkItem[] } | undefined) => data?.data ?? [];

  return useRemoteLookup<DoctypeLinkItem[], DoctypeLinkItem, LookupOption>({
    shouldFetch,
    query,
    method: customMethod?.method || "frappe.client.get_list",
    params,
    getItems: getItems as (message: unknown) => DoctypeLinkItem[],
    mapOption: (item) => ({
      label:
        labelField === "name"
          ? (item[valueField] as string)
          : ((item[labelField] as string) ?? (item[valueField] as string)),
      value: item[valueField] as string,
    }),
    selectedOption,
  });
};
