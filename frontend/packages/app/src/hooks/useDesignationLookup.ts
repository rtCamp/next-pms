/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type DesignationLookupItem = {
  name: string;
};

type DesignationLookupResult = DesignationLookupItem[];

interface UseDesignationLookupOptions {
  /** Controls whether the designation lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of designation rows fetched per request. */
  pageSize?: number;
  /** Filters designations by designation name or id. */
  query: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: LookupOption | LookupOption[] | null;
}

/**
 * Fetches designation records for lookup fields.
 */
export const useDesignationLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  revalidateOnFocus,
  selectedOption,
}: UseDesignationLookupOptions) => {
  return useRemoteLookup<
    DesignationLookupResult,
    DesignationLookupItem,
    LookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Designation",
      fields: ["name"],
      limit_page_length: pageSize,
      or_filters: searchQuery
        ? [["Designation", "name", "like", `%${searchQuery}%`]]
        : undefined,
    }),
    getItems: (message) => message ?? [],
    mapOption: (designation) => ({
      label: designation.name,
      value: designation.name,
    }),
    selectedOption,
  });
};
