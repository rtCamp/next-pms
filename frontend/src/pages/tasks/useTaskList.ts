import {
  computed,
  inject,
  provide,
  reactive,
  ref,
  watch,
  type InjectionKey,
} from "vue";
import { toast, useCall, useDoctype } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { buildFilterConditions } from "@/utils/filters";
import { TASK_LIST_PAGE_SIZE } from "./constants";
import type { TaskListItem, TaskListResponse } from "./types";
import { useTaskFilters } from "./useTaskFilters";

type TaskListParams = Record<string, string | number | undefined>;

/**
 * What the in-flight request is for: a new query (rows kept, overlay shown), the next
 * page, or a quiet reload of the pages already shown.
 */
type RequestKind = "query" | "next" | "reload";

function createTaskList() {
  const { filters, sort } = useTaskFilters();
  const taskList = useCall<TaskListResponse, TaskListParams>({
    url: "/api/v2/method/next_pms.timesheet.api.task.get_task_list",
    immediate: false,
  });
  const tasks = useDoctype<TaskListItem>("Task");

  const rows = ref<TaskListItem[]>([]);
  const hasMore = ref(true);
  const loaded = ref(false);
  const pending = ref<RequestKind | null>(null);
  // Only the newest request may write the rows; an older one can land after it.
  let latestRequest = 0;

  // GET params go through URLSearchParams, so lists are sent as JSON strings; the
  // endpoint json-decodes them.
  const queryParams = computed<TaskListParams>(() => {
    const advanced = buildFilterConditions(filters.value.advanced);
    const { field, order } = sort.value;
    return {
      search: filters.value.search || undefined,
      projects: filters.value.project
        ? JSON.stringify([filters.value.project])
        : undefined,
      status: filters.value.status.length
        ? JSON.stringify(filters.value.status)
        : undefined,
      filters: advanced.length ? JSON.stringify(advanced) : undefined,
      order_by: field ? `${field} ${order}` : undefined,
    };
  });

  async function fetchRows(
    start: number,
    pageLength: number,
    kind: RequestKind,
  ) {
    const request = ++latestRequest;
    pending.value = kind;
    // submit() rejects when the request fails; the error is read from the call below.
    const response = await taskList
      .submit({ ...queryParams.value, start, page_length: pageLength })
      .catch(() => null);
    if (request !== latestRequest) return;
    pending.value = null;
    if (!response) {
      toast.error(errorMessage(taskList.error));
      return;
    }
    rows.value =
      kind === "next" ? [...rows.value, ...response.task] : response.task;
    hasMore.value = response.has_more;
    loaded.value = true;
  }

  function loadMore() {
    if (pending.value || !hasMore.value) return;
    fetchRows(rows.value.length, TASK_LIST_PAGE_SIZE, "next");
  }

  /** Reloads every page shown so far in one request, without the loading overlay. */
  function refresh() {
    fetchRows(0, Math.max(rows.value.length, TASK_LIST_PAGE_SIZE), "reload");
  }

  async function deleteTask(name: string) {
    try {
      await tasks.delete.submit({ name });
      refresh();
      toast.success("Task deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  // Compared as JSON: the filters are rebuilt on every route change, including
  // changes that don't touch them, such as the column order.
  watch(
    () => JSON.stringify(queryParams.value),
    () => fetchRows(0, TASK_LIST_PAGE_SIZE, "query"),
    { immediate: true },
  );

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
    deleteTask,
  });
}

export type TaskList = ReturnType<typeof createTaskList>;

const taskListKey: InjectionKey<TaskList> = Symbol("taskList");

/** Creates the task list for the page and shares it with the components below. */
export function provideTaskList(): TaskList {
  const taskList = createTaskList();
  provide(taskListKey, taskList);
  return taskList;
}

/** The task list provided by the page. */
export function useTaskList(): TaskList {
  const taskList = inject(taskListKey);
  if (!taskList) {
    throw new Error("useTaskList() needs provideTaskList() in a parent");
  }
  return taskList;
}
