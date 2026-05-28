/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type ContactRecord = {
  name: string;
  full_name?: string;
};

interface UseCustomerContactLookupOptions {
  customer: string;
  shouldFetch?: boolean;
  pageSize?: number;
  query: string;
  selectedOption?: LookupOption | null;
}

export const useCustomerContactLookup = ({
  customer,
  shouldFetch = true,
  pageSize = 20,
  query,
  selectedOption,
}: UseCustomerContactLookupOptions) => {
  return useRemoteLookup<ContactRecord[], ContactRecord, LookupOption>({
    shouldFetch: shouldFetch && Boolean(customer),
    query,
    pageSize,
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "Contact",
      fields: ["name", "full_name"],
      filters: [
        ["Dynamic Link", "link_doctype", "=", "Customer"],
        ["Dynamic Link", "link_name", "=", customer],
        ...(searchQuery ? [["full_name", "like", `%${searchQuery}%`]] : []),
      ],
      limit,
    }),
    getItems: (message) => message ?? [],
    mapOption: (item) => ({
      label: item.full_name || item.name,
      value: item.name,
    }),
    selectedOption,
  });
};
