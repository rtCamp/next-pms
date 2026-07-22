/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortOrder, SortState } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { parseJSONArrayParam } from "@/lib/utils";
import type { TaskListFilters, TaskStatus } from "./types";

const FILTER_PARAM_KEYS = [
  "search",
  "project",
  "projectLabel",
  "status",
  "advanced",
  "sortField",
  "sortOrder",
] as const;

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TaskListFilters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      project: searchParams.get("project") ?? "",
      projectLabel: searchParams.get("projectLabel") ?? "",
      status: parseJSONArrayParam<TaskStatus>(
        searchParams.get("status"),
        decodeURI,
      ),
      advanced: parseJSONArrayParam<FilterCondition>(
        searchParams.get("advanced"),
      ),
    }),
    [searchParams],
  );

  const sort: SortState = useMemo(
    () => ({
      field: searchParams.get("sortField") ?? "modified",
      order: (searchParams.get("sortOrder") ?? "desc") as SortOrder,
    }),
    [searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const setSearch = useCallback(
    (v: string) => setParam("search", v),
    [setParam],
  );
  const setProject = useCallback(
    (v: string, label?: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v) next.set("project", v);
          else next.delete("project");
          if (label) next.set("projectLabel", label);
          else next.delete("projectLabel");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const setStatus = useCallback(
    (v: TaskStatus[]) =>
      setParam("status", v.length ? encodeURI(JSON.stringify(v)) : ""),
    [setParam],
  );
  const setAdvanced = useCallback(
    (v: FilterCondition[]) =>
      setParam("advanced", v.length ? JSON.stringify(v) : ""),
    [setParam],
  );
  const setSort = useCallback(
    (v: SortState | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!v) {
            next.delete("sortField");
            next.delete("sortOrder");
          } else {
            next.set("sortField", v.field);
            next.set("sortOrder", v.order);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const resetFilters = useCallback(
    () =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of FILTER_PARAM_KEYS) next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return {
    filters,
    sort,
    setSearch,
    setProject,
    setStatus,
    setAdvanced,
    setSort,
    resetFilters,
  };
}
