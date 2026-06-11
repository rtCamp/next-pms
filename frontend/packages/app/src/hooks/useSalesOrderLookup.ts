/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";
import { currencyFormat } from "@/lib/utils";

type SalesOrderLookupItem = {
  name: string;
  customer_name?: string;
  status?: string;
  grand_total?: number;
  currency?: string;
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
      fields: [
        "name",
        "customer_name",
        "status",
        "grand_total",
        "currency",
        "transaction_date",
      ],
      limit_page_length: pageSize,
      filters: projectId ? { project: projectId } : undefined,
      or_filters: searchQuery
        ? [["Sales Order", "name", "like", `%${searchQuery}%`]]
        : undefined,
    }),
    getItems: (message) => message ?? [],
    mapOption: (salesOrder) => {
      const parts = [
        salesOrder.customer_name,
        salesOrder.status,
        salesOrder.grand_total != null
          ? currencyFormat(salesOrder.currency).format(salesOrder.grand_total)
          : undefined,
      ].filter(Boolean);
      return {
        label: salesOrder.name,
        value: salesOrder.name,
        description: parts.length ? parts.join(", ") : undefined,
      };
    },
    selectedOption,
  });
};
