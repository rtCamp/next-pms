/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type UtmSourceRecord = {
  name: string;
};

interface UseUtmSourceLookupOptions {
  shouldFetch?: boolean;
  pageSize?: number;
  query: string;
  selectedOption?: LookupOption | null;
}

export const useUtmSourceLookup = ({
  shouldFetch = true,
  pageSize = 20,
  query,
  selectedOption,
}: UseUtmSourceLookupOptions) => {
  return useRemoteLookup<UtmSourceRecord[], UtmSourceRecord, LookupOption>({
    shouldFetch,
    query,
    pageSize,
    method: "frappe.client.get_list",
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "UTM Source",
      fields: ["name"],
      filters: searchQuery ? [["name", "like", `%${searchQuery}%`]] : undefined,
      limit,
    }),
    getItems: (message) => message ?? [],
    mapOption: (item) => ({ label: item.name, value: item.name }),
    selectedOption,
  });
};
