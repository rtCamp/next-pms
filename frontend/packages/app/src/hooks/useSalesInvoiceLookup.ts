/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";
import { currencyFormat } from "@/lib/utils";

type SalesInvoiceLookupItem = {
  name: string;
  customer_name?: string;
  status?: string;
  grand_total?: number;
  currency?: string;
  posting_date?: string;
};

type SalesInvoiceLookupResult = SalesInvoiceLookupItem[];

interface UseSalesInvoiceLookupOptions {
  /** Controls whether the sales invoice lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of sales invoice rows fetched per request. */
  pageSize?: number;
  /** Filters sales invoices by partial name on the backend. */
  query: string;
  /** Restricts the lookup to sales invoices linked to this project. */
  projectId?: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: LookupOption | null;
}

/**
 * Fetches Sales Invoice records for lookup fields, optionally scoped to a project.
 */
export const useSalesInvoiceLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  projectId,
  revalidateOnFocus,
  selectedOption,
}: UseSalesInvoiceLookupOptions) => {
  return useRemoteLookup<
    SalesInvoiceLookupResult,
    SalesInvoiceLookupItem,
    LookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Sales Invoice",
      fields: [
        "name",
        "customer_name",
        "status",
        "grand_total",
        "currency",
        "posting_date",
      ],
      limit_page_length: pageSize,
      filters: projectId ? { project: projectId } : undefined,
      or_filters: searchQuery
        ? [["Sales Invoice", "name", "like", `%${searchQuery}%`]]
        : undefined,
    }),
    getItems: (message) => message ?? [],
    mapOption: (salesInvoice) => {
      const parts = [
        salesInvoice.customer_name,
        salesInvoice.status,
        salesInvoice.grand_total != null
          ? currencyFormat(salesInvoice.currency).format(
              salesInvoice.grand_total,
            )
          : undefined,
      ].filter(Boolean);
      return {
        label: salesInvoice.name,
        value: salesInvoice.name,
        description: parts.length ? parts.join(", ") : undefined,
      };
    },
    selectedOption,
  });
};
