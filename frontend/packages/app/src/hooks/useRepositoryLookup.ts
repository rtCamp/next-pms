/**
 * Internal Dependencies.
 */
import { useMemo } from "react";
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type RepositoryLookupItem = {
  name: string;
  repository_name?: string;
  repository_owner?: string;
  repository_url?: string;
};

type RepositoryLookupResult = RepositoryLookupItem[];

export type RepositoryLookupOption = LookupOption & {
  fullPath: string;
  githubUrl: string;
};

interface UseRepositoryLookupOptions {
  /** Controls whether the repository lookup should fetch for the current UI state. */
  shouldFetch?: boolean;
  /** Filters repositories by partial name or full-path match (backend). */
  query?: string;
  /** Hides repositories whose ids appear in this set (e.g. already-connected). */
  excludeIds?: Set<string>;
  /** Caps the number of repository rows fetched per request. */
  pageSize?: number;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: RepositoryLookupOption | null;
}

/**
 * Fetches GitHub Repository Child records for repository lookup fields.
 */
export const useRepositoryLookup = ({
  shouldFetch = true,
  query = "",
  excludeIds,
  pageSize = 20,
  revalidateOnFocus,
  selectedOption,
}: UseRepositoryLookupOptions = {}) => {
  const { options, isLoading, error } = useRemoteLookup<
    RepositoryLookupResult,
    RepositoryLookupItem,
    RepositoryLookupOption
  >({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "GitHub Repository",
      fields: ["name", "repository_name", "repository_owner", "repository_url"],
      limit_page_length: limit,
      or_filters: searchQuery
        ? [
            ["GitHub Repository", "name", "like", `%${searchQuery}%`],
            [
              "GitHub Repository",
              "repository_name",
              "like",
              `%${searchQuery}%`,
            ],
            [
              "GitHub Repository",
              "repository_owner",
              "like",
              `%${searchQuery}%`,
            ],
          ]
        : undefined,
      start: 0,
    }),
    getItems: (message) => message ?? [],
    mapOption: (repo) => ({
      label: repo.repository_name || repo.name,
      value: repo.name,
      fullPath:
        repo.repository_owner && repo.repository_name
          ? `${repo.repository_owner}/${repo.repository_name}`
          : repo.name,
      githubUrl: repo.repository_url ?? "",
    }),
    selectedOption,
  });

  const decoratedOptions = useMemo(
    () =>
      excludeIds?.size
        ? options.map((o) =>
            excludeIds.has(o.value) ? { ...o, disabled: true } : o,
          )
        : options,
    [options, excludeIds],
  );

  return { options: decoratedOptions, isLoading, error };
};
