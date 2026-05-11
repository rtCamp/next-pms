import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type ProjectFilters = Record<string, unknown> | unknown[] | null | undefined;

type ProjectLookupItem = {
  name: string;
  project_name: string;
  customer?: string;
};

type ProjectLookupResult = {
  data: ProjectLookupItem[];
};

export type ProjectLookupOption = LookupOption & {
  customer?: string;
};

interface UseProjectLookupOptions {
  /** Controls whether the project lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Adds fixed backend filters alongside the search filters. */
  extraFilters?: ProjectFilters;
  /** Caps the number of project rows fetched per request. */
  pageSize?: number;
  /** Filters projects through backend or_filters on id and project name. */
  query: string;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: ProjectLookupOption | null;
}

/**
 * Fetches project combobox options using the backend's filters and or_filters contract.
 */
export const useProjectLookup = ({
  shouldFetch,
  extraFilters,
  pageSize = 20,
  query,
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
    method: "next_pms.timesheet.api.project.get_projects",
    params: ({ query: searchQuery, pageSize }) => ({
      fields: ["name", "project_name", "customer"],
      filters: extraFilters ?? undefined,
      limit: pageSize,
      or_filters: searchQuery
        ? [
            ["Project", "name", "like", `%${searchQuery}%`],
            ["Project", "project_name", "like", `%${searchQuery}%`],
          ]
        : undefined,
      start: 0,
    }),
    getItems: (message) => message?.data ?? [],
    mapOption: (project) => ({
      label: project.project_name,
      value: project.name,
      customer: project.customer,
    }),
    selectedOption,
  });
};
