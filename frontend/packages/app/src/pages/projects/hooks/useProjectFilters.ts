/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type {
  Phase,
  ProjectListFilters,
  ProjectStatus,
  RagStatus,
} from "../types";

const FILTER_PARAM_KEYS = [
  "search",
  "rag",
  "phase",
  "status",
  "advanced",
] as const;

const parseAdvanced = (raw: string | null): FilterCondition[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FilterCondition[]) : [];
  } catch {
    return [];
  }
};

export function useProjectFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ProjectListFilters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      ragStatus: (searchParams.get("rag") ?? "") as RagStatus | "",
      phase: (searchParams.get("phase") ?? "") as Phase | "",
      status: (searchParams.get("status") ?? "") as ProjectStatus | "",
      advanced: parseAdvanced(searchParams.get("advanced")),
    }),
    [searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) =>
      setSearchParams(
        (prev) => {
          if (value) prev.set(key, value);
          else prev.delete(key);
          return prev;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const setSearch = useCallback(
    (v: string) => setParam("search", v),
    [setParam],
  );
  const setRagStatus = useCallback(
    (v: RagStatus | "") => setParam("rag", v),
    [setParam],
  );
  const setPhase = useCallback(
    (v: Phase | "") => setParam("phase", v),
    [setParam],
  );
  const setStatus = useCallback(
    (v: ProjectStatus | "") => setParam("status", v),
    [setParam],
  );
  const setAdvanced = useCallback(
    (v: FilterCondition[]) =>
      setParam("advanced", v.length ? JSON.stringify(v) : ""),
    [setParam],
  );
  const resetFilters = useCallback(
    () =>
      setSearchParams(
        (prev) => {
          for (const key of FILTER_PARAM_KEYS) prev.delete(key);
          return prev;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return {
    filters,
    setSearch,
    setRagStatus,
    setPhase,
    setStatus,
    setAdvanced,
    resetFilters,
  };
}
