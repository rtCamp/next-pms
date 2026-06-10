/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type SalesOrderLookupItem = {
  name: string;
  transaction_date?: string;
};

type SalesOrderLookupResult = SalesOrderLookupItem[];

interface UseSalesOrderLookupOptions {
  /** Controls whether the sales order lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of sales order rows fetched per request. */
  pageSize?: number;
  /** Filters sales orders by partial name on the backend. */
  query: string;
  /** Restricts the lookup to sales orders linked to this project. */
  projectId?: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: LookupOption | null;
}

/**
 * Fetches Sales Order records for lookup fields, optionally scoped to a project.
 */
export const useSalesOrderLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  projectId,
  revalidateOnFocus,
  selectedOption,
}: UseSalesOrderLookupOptions) => {
  return useRemoteLookup<
    SalesOrderLookupResult,
    SalesOrderLookupItem,
    LookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Sales Order",
      fields: ["name", "transaction_date"],
      limit_page_length: pageSize,
      filters: projectId ? { project: projectId } : undefined,
      or_filters: searchQuery
        ? [["Sales Order", "name", "like", `%${searchQuery}%`]]
        : undefined,
    }),
    getItems: (message) => message ?? [],
    mapOption: (salesOrder) => ({
      label: salesOrder.name,
      value: salesOrder.name,
    }),
    selectedOption,
  });
};
