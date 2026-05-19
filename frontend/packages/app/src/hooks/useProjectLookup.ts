/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";
import type { GlobalFilterCondition } from "@/types";

type ProjectLookupItem = {
  name: string;
  project_name: string;
  customer?: string;
};

type ProjectLookupResult = ProjectLookupItem[];

export type ProjectLookupOption = LookupOption & {
  customer?: string;
};

interface UseProjectLookupOptions {
  /** Controls whether the project lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Adds fixed backend filters alongside the search filters. */
  filters?: GlobalFilterCondition[] | string | null;
  /** Caps the number of project rows fetched per request. */
  pageSize?: number;
  /** Filters projects through backend or_filters on id and project name. */
  query: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: ProjectLookupOption | null;
}

/**
 * Fetches project records for lookup fields.
 */
export const useProjectLookup = ({
  shouldFetch,
  filters,
  pageSize = 20,
  query,
  revalidateOnFocus,
  selectedOption,
}: UseProjectLookupOptions) => {
  return useRemoteLookup<
    ProjectLookupResult,
    ProjectLookupItem,
    ProjectLookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize }) => ({
      doctype: "Project",
      fields: ["name", "project_name", "customer"],
      filters: filters ?? undefined,
      limit_page_length: pageSize,
      or_filters: searchQuery
        ? [
            ["Project", "name", "like", `%${searchQuery}%`],
            ["Project", "project_name", "like", `%${searchQuery}%`],
          ]
        : undefined,
      start: 0,
    }),
    getItems: (message) => message ?? [],
    mapOption: (project) => ({
      label: project.project_name,
      value: project.name,
      customer: project.customer,
    }),
    selectedOption,
  });
};
