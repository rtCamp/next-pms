import {
  computed,
  inject,
  onScopeDispose,
  provide,
  reactive,
  shallowRef,
  watch,
  type InjectionKey,
} from "vue";
import { toast, useCall } from "frappe-ui";
import type { AllocationEventData } from "@/components/GanttGrid";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";
import {
  ALLOCATIONS_PAGE_SIZE,
  FILTER_DEBOUNCE_MS,
  REALTIME_DEBOUNCE_MS,
  RESOURCE_ALLOCATION_DOCTYPE,
} from "@/pages/allocations/shared/constants";
import { formatISODate } from "@/pages/allocations/shared/dateWindow";
import {
  compositeFiltersParam,
  sortedListParam,
  teamAllocationTypeParams,
} from "@/pages/allocations/shared/filterParams";
import { indexCustomers } from "@/pages/allocations/shared/segments";
import {
  useAllocationDialogs,
  useAllocationsPage,
} from "@/pages/allocations/shared/useAllocationDialogs";
import { useAllocationsQuery } from "@/pages/allocations/shared/useAllocationsQuery";
import { errorMessage } from "@/utils/errors";
import { TEAM_ENDPOINT, TEAM_LIST_PARAMS } from "./constants";
import { mapTeamEmployees } from "./teamRows";
import type { TeamAllocationsResponse } from "./types";

type TeamParams = Record<string, string | number | boolean | undefined>;

interface Page {
  start: number;
  payload: TeamAllocationsResponse;
}

interface Approver {
  name: string;
  employee_name: string;
}

/** A debounced copy of a list, so typing in a filter doesn't load on every pick. */
function useDebouncedList(source: () => string[]) {
  const value = shallowRef(source());
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => JSON.stringify(source()),
    () => {
      clearTimeout(timer);
      timer = setTimeout(() => (value.value = source()), FILTER_DEBOUNCE_MS);
    },
  );
  onScopeDispose(() => clearTimeout(timer));
  return value;
}

function createTeamAllocations() {
  const query = useAllocationsQuery({ listParams: TEAM_LIST_PARAMS });
  const dialogs = useAllocationDialogs();
  const unsaved = useUnsavedChanges();

  const designation = useDebouncedList(() => query.lists.value.designation);
  const department = useDebouncedList(() => query.lists.value.department);

  const params = computed<TeamParams>(() => {
    const typeParams = teamAllocationTypeParams(query.allocationTypes.value);
    return {
      date: formatISODate(query.anchorDate.value),
      max_week: query.weekCount.value,
      employee_name: query.search.value || undefined,
      designation: sortedListParam(designation.value),
      department: sortedListParam(department.value),
      ...typeParams,
      // A GET sends `false` as a truthy string, so it is left out instead.
      no_allocation: typeParams.no_allocation || undefined,
      filters: compositeFiltersParam(query.compositeFilters.value),
    };
  });
  /** Identifies the query; compared as JSON since it is rebuilt on every route change. */
  const queryKey = computed(() => JSON.stringify(params.value));

  const pageCall = useCall<TeamAllocationsResponse, TeamParams>({
    url: TEAM_ENDPOINT,
    immediate: false,
  });
  // Refreshes go through their own call, so they don't abort a page load.
  const refreshCall = useCall<TeamAllocationsResponse, TeamParams>({
    url: TEAM_ENDPOINT,
    immediate: false,
  });
  const approvers = useCall<Approver[]>({
    url: "/api/v2/method/next_pms.timesheet.api.get_approver_details",
  });

  const pages = shallowRef<Page[]>([]);
  const loadedKey = shallowRef("");
  const pending = shallowRef<"query" | "next" | null>(null);
  // Set after a failed request so a still-visible sentinel can't retry it in a loop.
  const failed = shallowRef(false);
  let latestRequest = 0;

  function request(start: number) {
    return { ...params.value, start, page_length: ALLOCATIONS_PAGE_SIZE };
  }

  async function fetchPage(start: number, kind: "query" | "next") {
    const requestId = ++latestRequest;
    const key = queryKey.value;
    pending.value = kind;
    let payload: TeamAllocationsResponse | null;
    try {
      payload = await pageCall.submit(request(start));
    } catch (error) {
      if (requestId !== latestRequest) return;
      pending.value = null;
      failed.value = true;
      if (kind === "query") {
        pages.value = [];
        loadedKey.value = key;
      }
      toast.error(errorMessage(error));
      return;
    }
    if (requestId !== latestRequest || !payload) return;
    pending.value = null;
    failed.value = false;
    const page = { start, payload };
    if (kind === "next") {
      pages.value = [...pages.value, page];
      return;
    }
    pages.value = [page];
    loadedKey.value = key;
  }

  watch(queryKey, () => fetchPage(0, "query"), { immediate: true });

  const hasMore = computed(
    () => !failed.value && Boolean(pages.value.at(-1)?.payload.has_more),
  );

  function loadMore() {
    const last = pages.value.at(-1);
    if (pending.value || !hasMore.value || !last) return;
    fetchPage(last.start + ALLOCATIONS_PAGE_SIZE, "next");
  }

  /**
   * Loads the given loaded pages again in place, keeping the rows and the scroll; a new
   * query replacing the pages meanwhile wins.
   */
  async function reloadPages(starts: number[]) {
    const requestId = latestRequest;
    for (const start of starts) {
      let payload: TeamAllocationsResponse | null;
      try {
        payload = await refreshCall.submit(request(start));
      } catch (error) {
        toast.error(errorMessage(error));
        return;
      }
      if (!payload || requestId !== latestRequest) return;
      pages.value = pages.value.map((page) =>
        page.start === start ? { start, payload } : page,
      );
    }
  }

  /** After a write: the loaded pages holding these employees, or every loaded page. */
  function refresh(targets?: { employeeIds?: string[] }) {
    const employeeIds = new Set(targets?.employeeIds ?? []);
    const starts = pages.value
      .filter(
        (page) =>
          !employeeIds.size ||
          page.payload.employees.some((employee) =>
            employeeIds.has(employee.name),
          ),
      )
      .map((page) => page.start);
    return reloadPages(starts);
  }

  // Realtime: someone else's write loads the rows again. The page's own writes refresh
  // their rows themselves, and a pending resize or draft would be lost, so it waits.
  let realtimeTimer: ReturnType<typeof setTimeout> | undefined;
  const realtimeHeld = shallowRef(false);

  function applyRealtimeUpdate() {
    if (pending.value === "query") return;
    if (unsaved.hasUnsavedChanges()) {
      realtimeHeld.value = true;
      return;
    }
    refresh();
  }

  useDoctypeListUpdates(RESOURCE_ALLOCATION_DOCTYPE, () => {
    if (
      dialogs.writes.inFlight > 0 ||
      Date.now() - dialogs.writes.settledAt < REALTIME_DEBOUNCE_MS
    ) {
      return;
    }
    clearTimeout(realtimeTimer);
    realtimeTimer = setTimeout(applyRealtimeUpdate, REALTIME_DEBOUNCE_MS);
  });
  onScopeDispose(() => clearTimeout(realtimeTimer));

  watch(
    () => unsaved.hasUnsavedChanges(),
    (dirty) => {
      if (dirty || !realtimeHeld.value) return;
      realtimeHeld.value = false;
      if (dialogs.writes.inFlight === 0) refresh();
    },
  );

  const managerNames = computed(
    () =>
      new Map(
        (approvers.data ?? []).map((approver) => [
          approver.name,
          approver.employee_name,
        ]),
      ),
  );
  const employees = computed(() =>
    pages.value.flatMap((page) =>
      mapTeamEmployees(page.payload, managerNames.value),
    ),
  );
  const customers = computed(() =>
    indexCustomers(
      pages.value.flatMap((page) => page.payload.resource_allocations ?? []),
    ),
  );

  useAllocationsPage({
    refresh,
    customerIdFor: (data: AllocationEventData) =>
      (data.allocationId &&
        customers.value.byAllocation.get(data.allocationId)) ||
      (data.projectId && customers.value.byProject.get(data.projectId)) ||
      undefined,
  });

  return reactive({
    query,
    employees,
    hasMore,
    /** A new query is loading: the first page, or a filter or date change. */
    isQueryLoading: computed(() => pending.value === "query"),
    isNextPageLoading: computed(() => pending.value === "next"),
    /** Scrolls the grid back to the top whenever the query changes or Today is pressed. */
    scrollResetKey: computed(
      () => `${loadedKey.value}:${query.todayResetKey.value}`,
    ),
    loadMore,
    refresh,
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
