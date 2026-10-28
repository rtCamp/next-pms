import { toValue, type MaybeRefOrGetter } from "vue";
import {
  useRemoteLookup,
  type LookupOption,
} from "@/composables/useRemoteLookup";

interface ContactItem {
  name: string;
  full_name?: string | null;
}

export interface CustomerContactLookupOptions {
  /** The customer whose contacts are searched; no search runs without one. */
  customer: MaybeRefOrGetter<string>;
  enabled: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/**
 * Searches the Contacts linked to a customer by full name, labelled with their
 * full name.
 */
export function useCustomerContactLookup(
  options: CustomerContactLookupOptions,
) {
  return useRemoteLookup<ContactItem[] | null, ContactItem>({
    method: "frappe.client.get_list",
    enabled: () =>
      toValue(options.enabled) && Boolean(toValue(options.customer)),
    query: options.query,
    selected: options.selected,
    refetchOn: () => toValue(options.customer),
    params: (search) => ({
      doctype: "Contact",
      fields: JSON.stringify(["name", "full_name"]),
      filters: JSON.stringify([
        ["Dynamic Link", "link_doctype", "=", "Customer"],
        ["Dynamic Link", "link_name", "=", toValue(options.customer)],
        ...(search ? [["full_name", "like", `%${search}%`]] : []),
      ]),
      limit_page_length: 20,
    }),
    getItems: (response) => response ?? [],
    toOption: (contact) => ({
      label: contact.full_name || contact.name,
      value: contact.name,
    }),
  });
}
