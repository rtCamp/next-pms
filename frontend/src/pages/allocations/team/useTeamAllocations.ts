import { computed, inject, provide, reactive, type InjectionKey } from "vue";
import type { AllocationEventData } from "@/components/GanttGrid";
import { formatISODate } from "@/pages/allocations/shared/dateWindow";
import {
  compositeFiltersParam,
  sortedListParam,
  teamAllocationTypeParams,
} from "@/pages/allocations/shared/filterParams";
import { indexCustomers } from "@/pages/allocations/shared/segments";
import {
  useAllocationPages,
  useManagerNames,
  type AllocationsParams,
} from "@/pages/allocations/shared/useAllocationPages";
import { useAllocationsPage } from "@/pages/allocations/shared/useAllocationDialogs";
import { useAllocationsQuery } from "@/pages/allocations/shared/useAllocationsQuery";
import { TEAM_ENDPOINT, TEAM_LIST_PARAMS } from "./constants";
import { mapTeamEmployees } from "./teamRows";
import type { TeamAllocationsResponse } from "./types";
import { useDebouncedListParams } from "./useDebouncedListParams";

function createTeamAllocations() {
  const query = useAllocationsQuery({ listParams: TEAM_LIST_PARAMS });

  const queryParams = computed<AllocationsParams>(() => {
    const typeParams = teamAllocationTypeParams(query.allocationTypes.value);
    return {
      date: formatISODate(query.anchorDate.value),
      max_week: query.weekCount.value,
      employee_name: query.search.value || undefined,
      designation: sortedListParam(query.lists.value.designation),
      department: sortedListParam(query.lists.value.department),
      ...typeParams,
      // A GET sends `false` as a truthy string, so it is left out instead.
      no_allocation: typeParams.no_allocation || undefined,
      filters: compositeFiltersParam(query.compositeFilters.value),
    };
  });
  const params = useDebouncedListParams(
    () => queryParams.value,
    ["designation", "department"],
  );

  const rows = useAllocationPages<TeamAllocationsResponse>({
    url: TEAM_ENDPOINT,
    params: () => params.value,
    rowIds: (payload) => payload.employees.map((employee) => employee.name),
    targetIds: (targets) => targets?.employeeIds,
  });
  const managerNames = useManagerNames();

  const employees = computed(() =>
    rows.pages.value.flatMap((page) =>
      mapTeamEmployees(page.payload, managerNames.value),
    ),
  );
  const customers = computed(() =>
    indexCustomers(
      rows.pages.value.flatMap(
        (page) => page.payload.resource_allocations ?? [],
      ),
    ),
  );

  useAllocationsPage({
    refresh: rows.refresh,
    customerIdFor: (data: AllocationEventData) =>
      (data.allocationId &&
        customers.value.byAllocation.get(data.allocationId)) ||
      (data.projectId && customers.value.byProject.get(data.projectId)) ||
      undefined,
  });

  return reactive({
    query,
    employees,
    hasMore: rows.hasMore,
    isQueryLoading: rows.isQueryLoading,
    isNextPageLoading: rows.isNextPageLoading,
    /** Scrolls the grid back to the top whenever the query changes or Today is pressed. */
    scrollResetKey: computed(
      () => `${rows.loadedKey.value}:${query.todayResetKey.value}`,
    ),
    loadMore: rows.loadMore,
    refresh: rows.refresh,
  });
}

export type TeamAllocations = ReturnType<typeof createTeamAllocations>;

const teamAllocationsKey: InjectionKey<TeamAllocations> =
  Symbol("teamAllocations");

/** Creates the Team page's data and shares it with the components below. */
export function provideTeamAllocations(): TeamAllocations {
  const team = createTeamAllocations();
  provide(teamAllocationsKey, team);
  return team;
}

/** The Team page's data, provided by the page. */
export function useTeamAllocations(): TeamAllocations {
  const team = inject(teamAllocationsKey);
  if (!team) {
    throw new Error(
      "useTeamAllocations() needs provideTeamAllocations() in a parent",
    );
  }
  return team;
}
