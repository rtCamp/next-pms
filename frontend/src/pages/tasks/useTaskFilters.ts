import { computed } from "vue";
import { useRoute } from "vue-router";
import type { FilterCondition } from "../../components/Filter";
import type { SortOrder, SortState } from "../../components/SortSelector";
import { useQueryPatch } from "../../composables/useQueryPatch";
import { parseJSONArrayParam, queryString } from "../../utils/query";
import { DEFAULT_TASK_SORT } from "./constants";
import type { TaskListFilters, TaskListStatus } from "./types";

const FILTER_PARAMS = [
  "search",
  "project",
  "projectLabel",
  "status",
  "advanced",
] as const;

/**
 * The task list's filters and sort, kept in the route query so a reload or a shared link
 * restores them. Param names and encodings match the React page, so old bookmarks work.
 */
export function useTaskFilters() {
  const route = useRoute();
  const patchQuery = useQueryPatch();

  const filters = computed<TaskListFilters>(() => ({
    search: queryString(route.query.search),
    project: queryString(route.query.project),
    projectLabel: queryString(route.query.projectLabel),
    // The React page wrote `status` through encodeURI, so read it back the same way.
    status: parseJSONArrayParam<TaskListStatus>(
      queryString(route.query.status),
      decodeURI,
    ),
    advanced: parseJSONArrayParam<FilterCondition>(
      queryString(route.query.advanced),
    ),
  }));

  const sort = computed<SortState>(() => ({
    field: queryString(route.query.sortField) || DEFAULT_TASK_SORT.field,
    order: (queryString(route.query.sortOrder) ||
      DEFAULT_TASK_SORT.order) as SortOrder,
  }));

  function setSearch(search: string) {
    patchQuery({ search });
  }

  function setProject(project: string, label?: string) {
    patchQuery({ project, projectLabel: project ? label : "" });
  }

  function setStatus(status: TaskListStatus[]) {
    patchQuery({
      status: status.length ? encodeURI(JSON.stringify(status)) : "",
    });
  }

  function setAdvanced(advanced: FilterCondition[]) {
    patchQuery({ advanced: advanced.length ? JSON.stringify(advanced) : "" });
  }

  function setSort(next: SortState | null) {
    patchQuery({ sortField: next?.field, sortOrder: next?.order });
  }

  function resetFilters() {
    patchQuery(Object.fromEntries(FILTER_PARAMS.map((key) => [key, ""])));
  }

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
