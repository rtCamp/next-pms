/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type HostRecord = {
  name: string;
};

interface UseHostLookupOptions {
  shouldFetch?: boolean;
  pageSize?: number;
  query: string;
  selectedOption?: LookupOption | null;
}

export const useHostLookup = ({
  shouldFetch = true,
  pageSize = 20,
  query,
  selectedOption,
}: UseHostLookupOptions) => {
  return useRemoteLookup<HostRecord[], HostRecord, LookupOption>({
    shouldFetch,
    query,
    pageSize,
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "Host",
      fields: ["name"],
      filters: searchQuery ? [["name", "like", `%${searchQuery}%`]] : undefined,
      limit,
    }),
    getItems: (message) => message ?? [],
    mapOption: (item) => ({ label: item.name, value: item.name }),
    selectedOption,
  });
};
