import { computed, inject, provide, reactive, type InjectionKey } from "vue";
import type { AllocationEventData } from "@/components/GanttGrid";
import { formatISODate } from "@/pages/allocations/shared/dateWindow";
import {
  compositeFiltersParam,
  PROJECT_ALLOCATION_TYPE_OPTIONS,
  projectAllocationTypeParams,
} from "@/pages/allocations/shared/filterParams";
import {
  useAllocationPages,
  useManagerNames,
  type AllocationsParams,
} from "@/pages/allocations/shared/useAllocationPages";
import { useAllocationsPage } from "@/pages/allocations/shared/useAllocationDialogs";
import { useAllocationsQuery } from "@/pages/allocations/shared/useAllocationsQuery";
import { PROJECT_ENDPOINT } from "./constants";
import { indexProjectCustomers, mapProjectRows } from "./projectRows";
import type { ProjectAllocationsResponse } from "./types";

function createProjectAllocations() {
  const query = useAllocationsQuery({
    allocationTypeOptions: PROJECT_ALLOCATION_TYPE_OPTIONS,
  });

  const params = computed<AllocationsParams>(() => ({
    date: formatISODate(query.anchorDate.value),
    max_week: query.weekCount.value,
    project_name: query.search.value || undefined,
    ...projectAllocationTypeParams(query.allocationTypes.value),
    filters: compositeFiltersParam(query.compositeFilters.value),
  }));

  const rows = useAllocationPages<ProjectAllocationsResponse>({
    url: PROJECT_ENDPOINT,
    params: () => params.value,
    rowIds: (payload) => payload.data.map((project) => project.name),
    targetIds: (targets) => targets?.projectIds,
  });
  const managerNames = useManagerNames();

  const projects = computed(() =>
    rows.pages.value.flatMap((page) =>
      mapProjectRows(page.payload, managerNames.value),
    ),
  );
  const customers = computed(() =>
    indexProjectCustomers(
      rows.pages.value.flatMap((page) => page.payload.data ?? []),
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
    projects,
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

export type ProjectAllocations = ReturnType<typeof createProjectAllocations>;

const projectAllocationsKey: InjectionKey<ProjectAllocations> =
  Symbol("projectAllocations");

/** Creates the Project page's data and shares it with the components below. */
export function provideProjectAllocations(): ProjectAllocations {
  const project = createProjectAllocations();
  provide(projectAllocationsKey, project);
  return project;
}

/** The Project page's data, provided by the page. */
export function useProjectAllocations(): ProjectAllocations {
  const project = inject(projectAllocationsKey);
  if (!project) {
    throw new Error(
      "useProjectAllocations() needs provideProjectAllocations() in a parent",
    );
  }
  return project;
}
