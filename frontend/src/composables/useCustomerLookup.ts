import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface CustomerItem {
  name: string;
  customer_name: string;
}

export interface CustomerLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  /** Matched against the customer's id and name. */
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/** Searches enabled customers by id or name; options show the customer's name. */
export function useCustomerLookup(options: CustomerLookupOptions) {
  return useRemoteLookup<CustomerItem[] | null, CustomerItem>({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      doctype: "Customer",
      fields: JSON.stringify(["name", "customer_name"]),
      filters: JSON.stringify([["disabled", "=", 0]]),
      or_filters: query
        ? JSON.stringify([
            ["Customer", "name", "like", `%${query}%`],
            ["Customer", "customer_name", "like", `%${query}%`],
          ])
        : undefined,
      limit_page_length: 20,
    }),
    getItems: (response) => response ?? [],
    toOption: (customer) => ({
      label: customer.customer_name || customer.name,
      value: customer.name,
    }),
  });
}
