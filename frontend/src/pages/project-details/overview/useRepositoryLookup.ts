import type { MaybeRefOrGetter } from "vue";
import {
  useRemoteLookup,
  type LookupOption,
} from "@/composables/useRemoteLookup";

interface RepositoryItem {
  name: string;
  repository_name?: string | null;
  repository_owner?: string | null;
}

export interface RepositoryOption extends LookupOption {
  /** `owner/name`, or the record name when either is missing. */
  fullPath: string;
}

/**
 * Searches `GitHub Repository` records by name, repository name or owner, labelled
 * with the repository name.
 */
export function useRepositoryLookup(options: {
  enabled: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
}) {
  return useRemoteLookup<
    RepositoryItem[] | null,
    RepositoryItem,
    RepositoryOption
  >({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    params: (search) => ({
      doctype: "GitHub Repository",
      fields: JSON.stringify(["name", "repository_name", "repository_owner"]),
      limit_page_length: 20,
      start: 0,
      or_filters: search
        ? JSON.stringify(
            ["name", "repository_name", "repository_owner"].map((field) => [
              "GitHub Repository",
              field,
              "like",
              `%${search}%`,
            ]),
          )
        : undefined,
    }),
    getItems: (response) => response ?? [],
    toOption: (repo) => ({
      label: repo.repository_name || repo.name,
      value: repo.name,
      fullPath:
        repo.repository_owner && repo.repository_name
          ? `${repo.repository_owner}/${repo.repository_name}`
          : repo.name,
    }),
  });
}
