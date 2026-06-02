/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type TerritoryRecord = {
  name: string;
};

interface UseTerritoryLookupOptions {
  shouldFetch?: boolean;
  pageSize?: number;
  query: string;
  selectedOption?: LookupOption | null;
}

export const useTerritoryLookup = ({
  shouldFetch = true,
  pageSize = 20,
  query,
  selectedOption,
}: UseTerritoryLookupOptions) => {
  return useRemoteLookup<TerritoryRecord[], TerritoryRecord, LookupOption>({
    shouldFetch,
    query,
    pageSize,
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "Territory",
      fields: ["name"],
      filters: searchQuery ? [["name", "like", `%${searchQuery}%`]] : undefined,
      limit,
    }),
    getItems: (message) => message ?? [],
    mapOption: (item) => ({ label: item.name, value: item.name }),
    selectedOption,
  });
};
