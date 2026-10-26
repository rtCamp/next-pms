import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import { useRemoteLookup } from "@/composables/useRemoteLookup";
import { formatCurrency } from "@/utils/format";

interface SalesDoc {
  name: string;
  customer_name?: string;
  status?: string;
  grand_total?: number;
  currency?: string;
}

/** Searches the customer's Sales Orders or Sales Invoices by name. */
export function useSalesDocLookup(options: {
  doctype: "Sales Order" | "Sales Invoice";
  customer: MaybeRefOrGetter<string | undefined>;
  enabled: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
}) {
  return useRemoteLookup<SalesDoc[] | null, SalesDoc>({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    refetchOn: () => toValue(options.customer),
    params: (query) => ({
      doctype: options.doctype,
      fields: JSON.stringify([
        "name",
        "customer_name",
        "status",
        "grand_total",
        "currency",
      ]),
      limit_page_length: 20,
      filters: JSON.stringify([
        [options.doctype, "customer", "=", toValue(options.customer) || ""],
      ]),
      or_filters: query
        ? JSON.stringify([[options.doctype, "name", "like", `%${query}%`]])
        : undefined,
    }),
    getItems: (response) => response ?? [],
    toOption: (doc) => {
      const parts = [
        doc.customer_name,
        doc.status,
        doc.grand_total != null
          ? formatCurrency(doc.grand_total, doc.currency)
          : undefined,
      ].filter(Boolean);
      return {
        label: doc.name,
        value: doc.name,
        description: parts.length ? parts.join(", ") : undefined,
      };
    },
  });
}
