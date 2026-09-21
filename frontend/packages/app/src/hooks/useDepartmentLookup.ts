/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type DepartmentRecord = {
  name: string;
};

interface UseDepartmentLookupOptions {
  /** Controls whether the department lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of department rows fetched per request. */
  pageSize?: number;
  /** Filters departments by department name. */
  query: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: LookupOption | LookupOption[] | null;
}

/**
 * Fetches department records for lookup fields.
 */
export const useDepartmentLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  revalidateOnFocus,
  selectedOption,
}: UseDepartmentLookupOptions) => {
  return useRemoteLookup<DepartmentRecord[], DepartmentRecord, LookupOption>({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "Department",
      fields: ["name"],
      filters: [
        ["is_group", "=", 0],
        ...(searchQuery ? [["name", "like", `%${searchQuery}%`]] : []),
      ],
      order_by: "name asc",
      limit_page_length: limit,
    }),
    getItems: (message) => message ?? [],
    mapOption: (department) => ({
      label: department.name,
      value: department.name,
    }),
    selectedOption,
  });
};
