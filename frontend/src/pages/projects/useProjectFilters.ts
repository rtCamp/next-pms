import { computed } from "vue";
import { useRoute } from "vue-router";
import type { FilterCondition } from "@/components/Filter";
import type { SortOrder, SortState } from "@/components/SortSelector";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { parseJSONArrayParam, queryString } from "@/utils/query";
import {
  DEFAULT_PROJECT_SORT,
  FILTER_PARAM_KEYS,
  MONETARY_SORT_FIELDS,
} from "./constants";
import type { ProjectListFilters, ProjectStatus, RagStatus } from "./types";

/** The site's default currency, which the filters start with. */
export function defaultCurrency(): string {
  return window.boot?.sysdefaults?.currency ?? "INR";
}

/**
 * The projects page's filters and sort, kept in the route query so a reload, a shared
 * link or a saved view restores them. Param names and encodings match the React page.
 */
export function useProjectFilters() {
  const route = useRoute();
  const patchQuery = useQueryPatch();

  const filters = computed<ProjectListFilters>(() => ({
    search: queryString(route.query.search),
    // The React page wrote `rag` through encodeURI, so read it back the same way.
    ragStatus: parseJSONArrayParam<RagStatus>(
      queryString(route.query.rag),
      decodeURI,
    ),
    phase: queryString(route.query.phase),
    status: queryString(route.query.status) as ProjectStatus | "",
    advanced: parseJSONArrayParam<FilterCondition>(
      queryString(route.query.advanced),
    ),
    currency: queryString(route.query.currency),
  }));

  const sort = computed<SortState>(() => ({
    field: queryString(route.query.sortField) || DEFAULT_PROJECT_SORT.field,
    order: (queryString(route.query.sortOrder) ||
      DEFAULT_PROJECT_SORT.order) as SortOrder,
  }));

  function setSearch(search: string) {
    patchQuery({ search });
  }

  function setRagStatus(ragStatus: RagStatus[]) {
    patchQuery({
      rag: ragStatus.length ? encodeURI(JSON.stringify(ragStatus)) : "",
    });
  }

  function setPhase(phase: string) {
    patchQuery({ phase });
  }

  function setStatus(status: ProjectStatus | "") {
    patchQuery({ status });
  }

  /** Clearing the currency also drops a sort on an amount, which needs one. */
  function setCurrency(currency: string) {
    const dropSort =
      !currency && MONETARY_SORT_FIELDS.includes(sort.value.field);
    patchQuery({
      currency,
      ...(dropSort ? { sortField: "", sortOrder: "" } : {}),
    });
  }

  function setAdvanced(advanced: FilterCondition[]) {
    patchQuery({ advanced: advanced.length ? JSON.stringify(advanced) : "" });
  }

  function setSort(next: SortState | null) {
    patchQuery({ sortField: next?.field, sortOrder: next?.order });
  }

  function resetFilters() {
    patchQuery(Object.fromEntries(FILTER_PARAM_KEYS.map((key) => [key, ""])));
  }

  return {
    filters,
    sort,
    setSearch,
    setRagStatus,
    setPhase,
    setStatus,
    setCurrency,
    setAdvanced,
    setSort,
    resetFilters,
  };
}
