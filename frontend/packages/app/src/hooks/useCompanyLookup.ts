/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";
import type { GlobalFilterCondition } from "@/types";

type CompanyLookupItem = {
  name: string;
  company_name: string;
};

type CompanyLookupResult = CompanyLookupItem[];

export type CompanyLookupOption = LookupOption;

interface UseCompanyLookupOptions {
  /** Controls whether the company lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Adds fixed backend filters alongside the search filters. */
  filters?: GlobalFilterCondition[] | string | null;
  /** Caps the number of company rows fetched per request. */
  pageSize?: number;
  /** Filters companies through backend or_filters on id and company name. */
  query: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: CompanyLookupOption | null;
}

/**
 * Fetches company records for lookup fields.
 */
export const useCompanyLookup = ({
  shouldFetch,
  filters,
  pageSize = 20,
  query,
  revalidateOnFocus,
  selectedOption,
}: UseCompanyLookupOptions) => {
  return useRemoteLookup<
    CompanyLookupResult,
    CompanyLookupItem,
    CompanyLookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Company",
      fields: ["name", "company_name"],
      filters: filters ?? undefined,
      limit_page_length: pageSize,
      or_filters: searchQuery
        ? [
            ["Company", "name", "like", `%${searchQuery}%`],
            ["Company", "company_name", "like", `%${searchQuery}%`],
          ]
        : undefined,
      start: 0,
    }),
    getItems: (message) => message ?? [],
    mapOption: (company) => ({
      label: company.company_name,
      value: company.name,
    }),
    selectedOption,
  });
};
