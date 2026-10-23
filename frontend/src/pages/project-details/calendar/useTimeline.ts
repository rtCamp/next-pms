import {
  computed,
  inject,
  onScopeDispose,
  provide,
  reactive,
  ref,
  watch,
  type InjectionKey,
} from "vue";
import { useRoute } from "vue-router";
import { dayjs, dialog, toast, useCall, useDoctype } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { createOwnWrites } from "@/pages/project-details/ownWrites";
import { useTodos } from "@/pages/project-details/to-do/useTodos";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { queryString } from "@/utils/query";
import {
  calendarView,
  deleteItemMessage,
  filterByType,
  isFollowing,
  itemPayload,
  listItems,
  monthItems,
  monthStart,
  monthWindow,
  tableTab,
} from "./calendar";
import {
  DEFAULT_TABLE_TAB,
  DEFAULT_VIEW,
  LIST_PAGE_SIZE,
  MONTH_ITEM_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SEARCH_PARAM,
  TABLE_TAB_TYPE,
  TIMELINE_API,
  TIMELINE_ITEM_DOCTYPE,
  TYPE_PARAM,
  VIEW_PARAM,
} from "./constants";
import type {
  CalendarView,
  TableTab,
  TimelineItem,
  TimelineItemForm,
  TimelineItemType,
  TimelinePage,
  TypeFilter,
} from "./types";

function createTimeline() {
  const route = useRoute();
  const patchQuery = useQueryPatch();
  const session = useSession();
  const { projectId } = useProjectDetails();
  const todos = useTodos();

  // URL state: replaced, not pushed, and left out at the default, as React.
  const view = computed<CalendarView>({
    get: () => calendarView(queryString(route.query[VIEW_PARAM])),
    set: (value) =>
      patchQuery({ [VIEW_PARAM]: value === DEFAULT_VIEW ? null : value }),
  });
  const tab = computed<TableTab>({
    get: () => tableTab(queryString(route.query[TYPE_PARAM])),
    set: (value) =>
      patchQuery({ [TYPE_PARAM]: value === DEFAULT_TABLE_TAB ? null : value }),
  });
  const search = computed(() => queryString(route.query[SEARCH_PARAM]));

  /** The search box's text; written to `?search=` after a pause in typing. */
  const searchInput = ref(search.value);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  watch(searchInput, (value) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (value !== search.value) patchQuery({ [SEARCH_PARAM]: value || null });
    }, SEARCH_DEBOUNCE_MS);
  });
  onScopeDispose(() => clearTimeout(searchTimer));

  /** First day of the month shown by the grid and the Gantt. */
  const month = ref(monthStart(new Date()));
  /** The day picked in the month picker, tinted in the grid. */
  const selectedDate = ref<string | null>(null);
  const typeFilter = ref<TypeFilter>("all");

  function pickDate(date: string) {
    month.value = monthStart(dayjs(date).toDate());
    selectedDate.value = date;
  }

  function shiftMonth(months: number) {
    month.value = dayjs(month.value).add(months, "month").toDate();
    selectedDate.value = null;
  }

  function goToToday() {
    month.value = monthStart(new Date());
    selectedDate.value = null;
  }

  const range = computed(() => monthWindow(month.value));
  const rangeKey = computed(
    () => `${range.value.startDate}/${range.value.endDate}`,
  );
  /** The range the month's data was read for; the data shows only while it matches. */
  const loadedRange = ref<string | null>(null);

  const monthCall = useCall<TimelinePage, Record<string, unknown>>({
    url: `${TIMELINE_API}.get_project_timeline_items`,
    params: () => ({
      project: projectId.value,
      start_date: range.value.startDate,
      end_date: range.value.endDate,
      limit: MONTH_ITEM_LIMIT,
      start: 0,
    }),
    refetch: true,
    onSuccess: () => (loadedRange.value = rangeKey.value),
    onError: (error) => {
      if (loadedRange.value === rangeKey.value && !isAbortError(error))
        toast.error(errorMessage(error));
    },
  });

  const monthLoaded = computed(() => loadedRange.value === rangeKey.value);
  const items = computed(() =>
    monthLoaded.value ? monthItems(monthCall.data?.data ?? []) : [],
  );

  // The List view's pages. A reload after a write rereads every loaded row at once.
  const listRows = ref<TimelineItem[]>([]);
  const listHasMore = ref(false);
  const listRequest = reactive({ start: 0, limit: LIST_PAGE_SIZE });
  let listActive = false;

  const listCall = useCall<TimelinePage, Record<string, unknown>>({
    url: `${TIMELINE_API}.get_project_timeline_items`,
    params: () => ({
      project: projectId.value,
      type: TABLE_TAB_TYPE[tab.value],
      ...(search.value ? { search: search.value } : {}),
      start: listRequest.start,
      limit: listRequest.limit,
    }),
    immediate: false,
    onSuccess: (page) => {
      const rows = listItems(page.data);
      listRows.value = listRequest.start ? [...listRows.value, ...rows] : rows;
      listHasMore.value = page.has_more;
    },
    onError: (error) => {
      if (isListReload() && !isAbortError(error))
        toast.error(errorMessage(error));
    },
  });

  function isListReload() {
    return listRequest.start === 0 && listRows.value.length > 0;
  }

  function fetchList(start: number, limit: number) {
    listRequest.start = start;
    listRequest.limit = limit;
    listCall.fetch();
  }

  function resetList() {
    listRows.value = [];
    listHasMore.value = false;
    fetchList(0, LIST_PAGE_SIZE);
  }

  function reloadList() {
    if (!listActive) return;
    fetchList(0, Math.max(LIST_PAGE_SIZE, listRows.value.length));
  }

  function loadMoreList() {
    if (listCall.loading || listCall.error || !listHasMore.value) return;
    fetchList(listRows.value.length, LIST_PAGE_SIZE);
  }

  watch(
    view,
    (current) => {
      if (current !== "list") return;
      if (listActive) reloadList();
      else {
        listActive = true;
        resetList();
      }
    },
    { immediate: true },
  );
  watch([tab, search], () => {
    if (listActive) resetList();
  });

  function refetch() {
    monthCall.reload();
    reloadList();
  }

  const { localWrite, isOwnEcho } = createOwnWrites({
    userId: () => session.userId,
    onMissedUpdate: refetch,
  });

  useDoctypeListUpdates(TIMELINE_ITEM_DOCTYPE, (update) => {
    if (isOwnEcho(update)) return;
    refetch();
    todos.refreshLinks();
  });

  const markComplete = useCall<unknown, { name: string; is_complete: number }>({
    url: `${TIMELINE_API}.mark_timeline_item_complete`,
    method: "POST",
    immediate: false,
  });
  const updateFollow = useCall<
    unknown,
    { doctype: string; doc_name: string; following: boolean }
  >({
    url: "/api/v2/method/frappe.desk.form.document_follow.update_follow",
    method: "POST",
    immediate: false,
  });
  const createItem = useCall<{ name: string }, Record<string, unknown>>({
    url: `${TIMELINE_API}.create_project_timeline_item`,
    method: "POST",
    immediate: false,
  });
  const editItem = useCall<{ name: string }, Record<string, unknown>>({
    url: `${TIMELINE_API}.edit_project_timeline_item`,
    method: "POST",
    immediate: false,
  });
  const timelineItems = useDoctype(TIMELINE_ITEM_DOCTYPE);
  const deleteTarget = ref("");
  const readItem = useCall<{ linked_todos?: { todo: string }[] }>({
    url: computed(
      () =>
        `/api/v2/document/${encodeURIComponent(TIMELINE_ITEM_DOCTYPE)}/${encodeURIComponent(deleteTarget.value)}`,
    ),
    immediate: false,
  });

  async function toggleComplete(item: TimelineItem) {
    try {
      await localWrite(
        () =>
          markComplete.submit({
            name: item.name,
            is_complete: item.isComplete ? 0 : 1,
          }),
        () => item.name,
      );
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success(
      item.isComplete ? "Marked as incomplete" : "Marked as completed",
    );
    refetch();
  }

  async function toggleFollow(item: TimelineItem) {
    const following = isFollowing(item, session.userId);
    let result: unknown;
    try {
      result = await updateFollow.submit({
        doctype: TIMELINE_ITEM_DOCTYPE,
        doc_name: item.name,
        following: !following,
      });
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }
    if (!following && !result) {
      toast.error("Document follow is not enabled for current user.");
      return;
    }
    toast.success(following ? "Unfollowed document" : "Following document");
    refetch();
  }

  /** Reads the item for its linked ToDos, then confirms; the dialog keeps a failed delete's error. */
  async function requestDelete(item: TimelineItem) {
    deleteTarget.value = item.name;
    const doc = await readItem.fetch();
    // As React: an unreadable item is confirmed without the linked ToDos line.
    const hasTodos = !readItem.error && Boolean(doc?.linked_todos?.length);
    dialog.danger({
      title: `Delete ${item.type.toLowerCase()}`,
      message: deleteItemMessage(item, hasTodos),
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await localWrite(
            () => timelineItems.delete.submit({ name: item.name }),
            () => item.name,
          );
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success(`${item.type} deleted`);
        refetch();
        todos.refreshLinks();
      },
    });
  }

  /** The create / edit dialog: open while `dialogType` is set; `editing` is `null` when creating. */
  const dialogType = ref<TimelineItemType | null>(null);
  const editing = ref<TimelineItem | null>(null);
  const saving = ref(false);

  function openCreate(type: TimelineItemType) {
    editing.value = null;
    dialogType.value = type;
  }

  function openEdit(item: TimelineItem) {
    editing.value = item;
    dialogType.value = item.type;
  }

  function closeDialog() {
    dialogType.value = null;
  }

  /** Creates or updates the dialog's item; resolves `true` when it saved. */
  async function save(form: TimelineItemForm): Promise<boolean> {
    const type = dialogType.value;
    if (!type || saving.value) return false;
    const item = editing.value;
    const payload = itemPayload(type, form);
    saving.value = true;
    try {
      await localWrite(
        () =>
          item
            ? editItem.submit({ name: item.name, ...payload })
            : createItem.submit({
                project: projectId.value,
                type,
                ...payload,
              }),
        (result) => result?.name,
      );
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      saving.value = false;
    }
    toast.success(`${type} ${item ? "updated" : "created"} successfully`);
    refetch();
    todos.refreshLinks();
    return true;
  }

  return {
    view,
    tab,
    search,
    searchInput,
    month,
    selectedDate,
    typeFilter,
    pickDate,
    goToPrevious: () => shiftMonth(-1),
    goToNext: () => shiftMonth(1),
    goToToday,
    /** The month's items, empty until the shown month has loaded. */
    items,
    /** The month's items of the type filter's type, for the grid and the Gantt. */
    filteredItems: computed(() => filterByType(items.value, typeFilter.value)),
    /** The month's items of the table tab's type, for the table under the grid or Gantt. */
    tableItems: computed(() =>
      items.value.filter((item) => item.type === TABLE_TAB_TYPE[tab.value]),
    ),
    monthLoading: computed(() => !monthLoaded.value && !monthCall.error),
    /** A failed read of the shown month; a failed refetch shows a toast instead. */
    monthError: computed(() => (monthLoaded.value ? null : monthCall.error)),
    reloadMonth: () => monthCall.reload(),
    listRows,
    listHasMore,
    listLoading: computed(() => listCall.loading),
    /** A failed page, or a failed reload of the loaded rows (also shown as a toast). */
    listError: computed(() => listCall.error),
    /** Whether `listError` is a failed reload of the loaded rows, not a new page. */
    listReloadFailed: computed(() => Boolean(listCall.error) && isListReload()),
    retryList: () => listCall.reload(),
    loadMoreList,
    isFollowing: (item: TimelineItem) => isFollowing(item, session.userId),
    toggleComplete,
    toggleFollow,
    requestDelete,
    dialogType,
    editing,
    saving,
    openCreate,
    openEdit,
    closeDialog,
    save,
  };
}

export type TimelineState = ReturnType<typeof createTimeline>;

const timelineKey: InjectionKey<TimelineState> = Symbol("timeline");

/**
 * The Calendar tab's state, provided by `CalendarTab`: the view, table tab and search
 * in the URL; the shown month, picked day and type filter; the month's items and the
 * List view's pages, refetched after every write and on realtime changes by others;
 * complete, follow and delete; and the one create / edit dialog.
 */
export function provideTimeline(): TimelineState {
  const timeline = createTimeline();
  provide(timelineKey, timeline);
  return timeline;
}

/** The Calendar tab state provided by `CalendarTab`. */
export function useTimeline(): TimelineState {
  const timeline = inject(timelineKey);
  if (!timeline)
    throw new Error("useTimeline() needs provideTimeline() in a parent");
  return timeline;
}
