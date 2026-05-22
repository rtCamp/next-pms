/**
 * External Dependencies.
 */
import { useMemo } from "react";

/**
 * Internal Dependencies.
 */
import type { LookupOption } from "@/hooks/useRemoteLookup";

type RepositoryRecord = {
  id: string;
  name: string;
  fullPath: string;
  githubUrl: string;
};

export type RepositoryLookupOption = LookupOption & {
  fullPath: string;
  githubUrl: string;
};

interface UseRepositoryLookupOptions {
  /** Controls whether the lookup should evaluate for the current UI state. */
  shouldFetch?: boolean;
  /** Filters repositories by partial name or full-path match (case-insensitive). */
  query?: string;
  /** Hides repositories whose ids appear in this set (e.g. already-connected). */
  excludeIds?: Set<string>;
  /** Caps the number of repository rows returned. */
  pageSize?: number;
}

// Local fake list. Mirrors the public shape of the BE-backed Lookup hooks so
// the consumer can swap in `useRemoteLookup` once a `Project Repository`
// doctype is wired up — out of scope for issue #1037.
const REPOSITORIES: RepositoryRecord[] = [
  {
    id: "atlas-design-system",
    name: "atlas-design-system",
    fullPath: "frappe/atlas-design-system",
    githubUrl: "https://github.com/frappe/atlas-design-system",
  },
  {
    id: "atlas-cms-migration",
    name: "atlas-cms-migration",
    fullPath: "frappe/atlas-cms-migration",
    githubUrl: "https://github.com/frappe/atlas-cms-migration",
  },
  {
    id: "atlas-search",
    name: "atlas-search",
    fullPath: "frappe/atlas-search",
    githubUrl: "https://github.com/frappe/atlas-search",
  },
  {
    id: "atlas-wcag-checker",
    name: "atlas-wcag-checker",
    fullPath: "frappe/atlas-wcag-checker",
    githubUrl: "https://github.com/frappe/atlas-wcag-checker",
  },
  {
    id: "atlas-program-finder",
    name: "atlas-program-finder",
    fullPath: "frappe/atlas-program-finder",
    githubUrl: "https://github.com/frappe/atlas-program-finder",
  },
];

/**
 * Returns a filtered list of project repositories suitable for a Combobox.
 */
export const useRepositoryLookup = ({
  shouldFetch = true,
  query = "",
  excludeIds,
  pageSize = 20,
}: UseRepositoryLookupOptions = {}) => {
  return useMemo(() => {
    if (!shouldFetch) {
      return { options: [] as RepositoryLookupOption[], isLoading: false };
    }
    const q = query.trim().toLowerCase();
    const filtered = REPOSITORIES.filter(
      (r) => !excludeIds?.has(r.id),
    )
      .filter(
        (r) =>
          q === "" ||
          r.name.toLowerCase().includes(q) ||
          r.fullPath.toLowerCase().includes(q),
      )
      .slice(0, pageSize);
    const options: RepositoryLookupOption[] = filtered.map((r) => ({
      label: r.name,
      value: r.id,
      fullPath: r.fullPath,
      githubUrl: r.githubUrl,
    }));
    return { options, isLoading: false };
  }, [shouldFetch, query, excludeIds, pageSize]);
};
