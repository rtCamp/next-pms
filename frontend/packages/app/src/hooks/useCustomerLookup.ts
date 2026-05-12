/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type CustomerLookupItem = {
  customer_name: string;
  name: string;
};

type CustomerLookupResult = CustomerLookupItem[];

interface UseCustomerLookupOptions {
  /** Controls whether the customer lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Caps the number of customer rows fetched per request. */
  pageSize?: number;
  /** Filters customers by customer name or id. */
  query: string;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: LookupOption | null;
}

/**
 * Fetches customer records for lookup fields.
 */
export const useCustomerLookup = ({
  shouldFetch,
  pageSize = 20,
  query,
  selectedOption,
}: UseCustomerLookupOptions) => {
  return useRemoteLookup<
    CustomerLookupResult,
    CustomerLookupItem,
    LookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    method: "frappe.client.get_list",
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Customer",
      fields: ["name", "customer_name"],
      limit_page_length: pageSize,
      or_filters: searchQuery
        ? [
            ["Customer", "name", "like", `%${searchQuery}%`],
            ["Customer", "customer_name", "like", `%${searchQuery}%`],
          ]
        : undefined,
    }),
    getItems: (message) => message ?? [],
    mapOption: (customer) => ({
      label: customer.customer_name,
      value: customer.name,
    }),
    selectedOption,
  });
};
