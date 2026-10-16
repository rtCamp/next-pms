import {
  computed,
  inject,
  provide,
  reactive,
  ref,
  watch,
  type InjectionKey,
} from "vue";
import { toast, useCall } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { errorMessage } from "@/utils/errors";
import { buildProjectFilters } from "./buildFilters";
import { PROJECT_LIST_PAGE_SIZE, PROJECTS_VIEW_METHOD } from "./constants";
import type { ProjectListItem, ProjectListResponse } from "./types";
import { useProjectFilters } from "./useProjectFilters";

type ProjectListParams = Record<string, string | number | undefined>;

/**
 * What the in-flight request is for: a new query (rows kept, overlay shown), the next
 * page, or a quiet reload of the pages already shown.
 */
type RequestKind = "query" | "next" | "reload";

function createProjectList() {
  const { filters, sort } = useProjectFilters();
  const projectList = useCall<ProjectListResponse, ProjectListParams>({
    url: `/api/v2/method/${PROJECTS_VIEW_METHOD}`,
    immediate: false,
  });

  const rows = ref<ProjectListItem[]>([]);
  const hasMore = ref(true);
  const loaded = ref(false);
  const pending = ref<RequestKind | null>(null);
  // Only the newest request may write the rows; an older one can land after it.
  let latestRequest = 0;

  const queryParams = computed<ProjectListParams>(() => {
    const frappeFilters = buildProjectFilters(filters.value);
    return {
      view: "list",
      search: filters.value.search || undefined,
      filters: frappeFilters.length ? JSON.stringify(frappeFilters) : undefined,
      order_by: `${sort.value.field} ${sort.value.order}`,
      currency: filters.value.currency || undefined,
    };
  });

  async function fetchRows(start: number, limit: number, kind: RequestKind) {
    const request = ++latestRequest;
    pending.value = kind;
    // submit() rejects when the request fails; the error is read from the call below.
    const response = await projectList
      .submit({ ...queryParams.value, start, limit })
      .catch(() => null);
    if (request !== latestRequest) return;
    pending.value = null;
    if (!response) {
      toast.error(errorMessage(projectList.error));
      return;
    }
    rows.value =
      kind === "next" ? [...rows.value, ...response.data] : response.data;
    hasMore.value = response.has_more;
    loaded.value = true;
  }

  function loadMore() {
    if (pending.value || !hasMore.value) return;
    fetchRows(rows.value.length, PROJECT_LIST_PAGE_SIZE, "next");
  }

  /** Reloads every page shown so far in one request, without the loading overlay. */
  function refresh() {
    fetchRows(0, Math.max(rows.value.length, PROJECT_LIST_PAGE_SIZE), "reload");
  }

  // Compared as JSON: the filters are rebuilt on every route change, including
  // changes that don't touch them, such as the column order.
  watch(
    () => JSON.stringify(queryParams.value),
    () => fetchRows(0, PROJECT_LIST_PAGE_SIZE, "query"),
    { immediate: true },
  );

  useDoctypeListUpdates("Project", refresh);

  return reactive({
    rows,
    hasMore,
    /** First load: nothing to show yet. */
    isInitialLoad: computed(() => !loaded.value && pending.value === "query"),
    /** A new query is loading while the previous rows stay on screen. */
    isFilterRequest: computed(() => loaded.value && pending.value === "query"),
    isNextPageLoading: computed(() => pending.value === "next"),
    isLoading: computed(() => pending.value !== null),
    loadMore,
    refresh,
  });
}

export type ProjectList = ReturnType<typeof createProjectList>;

const projectListKey: InjectionKey<ProjectList> = Symbol("projectList");

/** Creates the project list for the list view and shares it with its parts. */
export function provideProjectList(): ProjectList {
  const projectList = createProjectList();
  provide(projectListKey, projectList);
  return projectList;
}

/** The project list provided by the list view. */
export function useProjectList(): ProjectList {
  const projectList = inject(projectListKey);
  if (!projectList) {
    throw new Error("useProjectList() needs provideProjectList() in a parent");
  }
  return projectList;
}
