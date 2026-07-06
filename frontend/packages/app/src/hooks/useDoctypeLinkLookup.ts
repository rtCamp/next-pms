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
  shouldFetch,
  query,
  selectedOption,
}: UseDoctypeLinkLookupOptions) => {
  const fields =
    labelField === "name" || labelField === valueField
      ? [valueField]
      : [valueField, labelField];

  return useRemoteLookup<DoctypeLinkItem[], DoctypeLinkItem, LookupOption>({
    shouldFetch,
    query,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype,
      fields,
      limit_page_length: pageSize,
      order_by: `${labelField} asc`,
      filters: searchQuery
        ? [[labelField, "like", `%${searchQuery}%`]]
        : undefined,
    }),
    getItems: (message) => message ?? [],
    mapOption: (item) => ({
      label:
        labelField === "name"
          ? (item[valueField] as string)
          : (item[labelField] as string) ?? (item[valueField] as string),
      value: item[valueField] as string,
    }),
    selectedOption,
  });
};
