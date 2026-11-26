import { computed, shallowRef } from "vue";
import { useRoute } from "vue-router";
import type { FilterCondition } from "@/components/Filter";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { parseJSONArrayParam, queryString } from "@/utils/query";
import {
  ALLOCATION_TYPE_PARAM,
  COMPOSITE_FILTERS_PARAM,
  DATE_PARAM,
  DEFAULT_DURATION,
  DURATION_PARAM,
  DURATION_WEEKS,
  SEARCH_PARAM,
} from "./constants";
import {
  formatISODate,
  parseAnchorDate,
  parseDuration,
  shiftAnchorDate,
} from "./dateWindow";
import {
  ALLOCATION_TYPE_OPTIONS,
  normalizeAllocationTypes,
  parseAllocationTypes,
  type AllocationTypeValue,
} from "./filterParams";
import type { AllocationsDuration } from "./types";

function jsonParam(values: unknown[]): string {
  return values.length ? JSON.stringify(values) : "";
}

/**
 * An allocations page's window and filters, kept in the route query (`replace`) under the
 * React page's keys and formats: `search`, `date` (`YYYY-MM-DD`, today when absent),
 * `duration` (absent for this quarter), and JSON lists in `allocationType`,
 * `compositeFilters` and each of `listParams` (e.g. `designation`). An empty value
 * removes its key. `allocationType` keeps only the page's `allocationTypeOptions`.
 */
export function useAllocationsQuery<TList extends string = never>(
  options: {
    listParams?: readonly TList[];
    allocationTypeOptions?: readonly { value: AllocationTypeValue }[];
  } = {},
) {
  const route = useRoute();
  const patchQuery = useQueryPatch();
  const listParams = options.listParams ?? [];

  const search = computed(() => queryString(route.query[SEARCH_PARAM]));
  const duration = computed(() =>
    parseDuration(queryString(route.query[DURATION_PARAM])),
  );
  const anchorDate = computed(() =>
    parseAnchorDate(queryString(route.query[DATE_PARAM])),
  );
  const weekCount = computed(() => DURATION_WEEKS[duration.value]);
  const allocationTypes = computed(() =>
    normalizeAllocationTypes(
      parseAllocationTypes(
        parseJSONArrayParam(queryString(route.query[ALLOCATION_TYPE_PARAM])),
        options.allocationTypeOptions ?? ALLOCATION_TYPE_OPTIONS,
      ),
    ),
  );
  const compositeFilters = computed(() =>
    parseJSONArrayParam<FilterCondition>(
      queryString(route.query[COMPOSITE_FILTERS_PARAM]),
    ).filter(
      (condition) =>
        condition !== null &&
        typeof condition === "object" &&
        typeof condition.id === "string" &&
        typeof condition.field === "string" &&
        typeof condition.operator === "string",
    ),
  );
  const lists = computed(
    () =>
      Object.fromEntries(
        listParams.map((key) => [
          key,
          parseJSONArrayParam<unknown>(queryString(route.query[key])).filter(
            (value): value is string => typeof value === "string",
          ),
        ]),
      ) as Record<TList, string[]>,
  );

  /** Bumped by Today, so the grid scrolls back even when the date didn't change. */
  const todayResetKey = shallowRef(0);

  return {
    search,
    duration,
    anchorDate,
    weekCount,
    allocationTypes,
    compositeFilters,
    lists,
    todayResetKey,
    setSearch: (value: string) => patchQuery({ [SEARCH_PARAM]: value }),
    setDuration: (value: AllocationsDuration) =>
      patchQuery({
        [DURATION_PARAM]: value === DEFAULT_DURATION ? "" : value,
      }),
    setAllocationTypes: (values: AllocationTypeValue[]) =>
      patchQuery({ [ALLOCATION_TYPE_PARAM]: jsonParam(values) }),
    setCompositeFilters: (conditions: FilterCondition[]) =>
      patchQuery({ [COMPOSITE_FILTERS_PARAM]: jsonParam(conditions) }),
    setList: (key: TList, values: string[]) =>
      patchQuery({ [key]: jsonParam(values) }),
    previous: () =>
      patchQuery({
        [DATE_PARAM]: formatISODate(
          shiftAnchorDate(anchorDate.value, duration.value, -1),
        ),
      }),
    next: () =>
      patchQuery({
        [DATE_PARAM]: formatISODate(
          shiftAnchorDate(anchorDate.value, duration.value, 1),
        ),
      }),
    today: () => {
      todayResetKey.value += 1;
      return patchQuery({ [DATE_PARAM]: "" });
    },
    /** Clears the search, filters and duration; the date stays. */
    clearAll: () =>
      patchQuery(
        Object.fromEntries(
          [
            SEARCH_PARAM,
            DURATION_PARAM,
            ALLOCATION_TYPE_PARAM,
            COMPOSITE_FILTERS_PARAM,
            ...listParams,
          ].map((key) => [key, ""]),
        ),
      ),
  };
}

export type AllocationsQuery<TList extends string = never> = ReturnType<
  typeof useAllocationsQuery<TList>
>;
