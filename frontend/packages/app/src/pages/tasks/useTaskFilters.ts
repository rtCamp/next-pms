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
  const setProject = useCallback(
    (v: string, label?: string) => {
      setSearchParams(
        (prev) => {
          if (v) prev.set("project", v);
          else prev.delete("project");
          if (label) prev.set("projectLabel", label);
          else prev.delete("projectLabel");
          return prev;
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
      if (!v) {
        setSearchParams(
          (prev) => {
            prev.delete("sortField");
            prev.delete("sortOrder");
            return prev;
          },
          { replace: true },
        );
      } else {
        setParam("sortField", v.field);
        setParam("sortOrder", v.order);
      }
    },
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
    sort,
    setSearch,
    setProject,
    setStatus,
    setAdvanced,
    setSort,
    resetFilters,
  };
}
