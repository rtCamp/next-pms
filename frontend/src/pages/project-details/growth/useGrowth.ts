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
import { dialog, toast, useCall } from "frappe-ui";
import type { SortState } from "@/components/SortSelector";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { createOwnWrites } from "@/pages/project-details/ownWrites";
import { GET_LIST_URL } from "@/pages/project-details/shared/constants";
import { deleteRecordMessage } from "@/pages/project-details/shared/linkedTodos";
import { useDeleteTarget } from "@/pages/project-details/shared/useDeleteTarget";
import {
  documentUrl,
  useDocumentWrite,
} from "@/pages/project-details/shared/useDocumentWrite";
import { useUserDetails } from "@/pages/project-details/shared/useUserDetails";
import { useTodos } from "@/pages/project-details/to-do/useTodos";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { queryString } from "@/utils/query";
import {
  GROWTH_CATEGORY_DOCTYPE,
  GROWTH_DOCTYPE,
  GROWTH_LIST_FIELDS,
  GROWTH_LIST_LIMIT,
  GROWTH_PARAM,
  GROWTH_STATUS_DOCTYPE,
} from "./constants";
import {
  closedStatuses,
  createGrowthPayload,
  editGrowthPayload,
  EMPTY_GROWTH_FILTERS,
  growthGroups,
  growthListFilters,
  growthOrderBy,
  growthPeople,
  hasActiveFilters,
  isClosingStatus,
  openStatuses,
  ownerFilterOptions,
  toGrowthItems,
} from "./growth";
import type {
  GrowthDoc,
  GrowthFilters,
  GrowthForm,
  GrowthRow,
  GrowthStatus,
} from "./types";

type Params = Record<string, unknown>;

function createGrowth() {
  const route = useRoute();
  const patchQuery = useQueryPatch();
  const session = useSession();
  const todos = useTodos();
  const { projectId } = useProjectDetails();

  const filters = reactive<GrowthFilters>({ ...EMPTY_GROWTH_FILTERS });
  const sort = ref<SortState | null>(null);

  const listFilters = computed(() =>
    JSON.stringify(growthListFilters(projectId.value, filters)),
  );

  /** The filters and sort the rows were last read for. */
  const query = computed(
    () => `${listFilters.value} ${growthOrderBy(sort.value)}`,
  );
  const loadedQuery = ref<string | null>(null);

  const list = useCall<GrowthRow[], Params>({
    url: GET_LIST_URL,
    params: () => ({
      doctype: GROWTH_DOCTYPE,
      fields: JSON.stringify(GROWTH_LIST_FIELDS),
      filters: listFilters.value,
      order_by: growthOrderBy(sort.value),
      limit_page_length: GROWTH_LIST_LIMIT,
    }),
    refetch: true,
  });
  watch(
    () => list.loading,
    (loading) => {
      if (!loading) loadedQuery.value = query.value;
    },
  );

  const ownerRows = useCall<
    Pick<GrowthRow, "activity_owner" | "ideation_owner">[],
    Params
  >({
    url: GET_LIST_URL,
    params: () => ({
      doctype: GROWTH_DOCTYPE,
      fields: JSON.stringify(["activity_owner", "ideation_owner"]),
      filters: JSON.stringify([["project", "=", projectId.value]]),
      limit_page_length: GROWTH_LIST_LIMIT,
    }),
  });
  const people = computed(() => growthPeople(ownerRows.data ?? []));
  const users = useUserDetails(
    () => [...people.value.activityOwners, ...people.value.ideationOwners],
    "userDetails",
  );

  // `limit_page_length: 0` reads every master; React stopped at 20.
  const statusRows = useCall<GrowthStatus[], Params>({
    url: GET_LIST_URL,
    params: {
      doctype: GROWTH_STATUS_DOCTYPE,
      fields: JSON.stringify(["name", "status_type", "is_closed"]),
      order_by: "name asc",
      limit_page_length: 0,
    },
  });
  const categoryRows = useCall<{ name: string }[], Params>({
    url: GET_LIST_URL,
    params: {
      doctype: GROWTH_CATEGORY_DOCTYPE,
      fields: JSON.stringify(["name"]),
      order_by: "name asc",
      limit_page_length: 0,
    },
  });
  const statuses = computed(() => statusRows.data ?? []);

  const items = computed(() => toGrowthItems(list.data ?? [], users.value));

  function refresh() {
    return Promise.all([list.reload(), ownerRows.reload()]);
  }

  const changeListeners = new Set<(name?: string) => void>();

  /** Runs `listener` after a local or realtime change to an initiative, until the caller's scope ends. */
  function onGrowthChanged(listener: (name?: string) => void) {
    changeListeners.add(listener);
    onScopeDispose(() => changeListeners.delete(listener));
  }

  /** Reads the list again and tells the listeners; `name` is the changed record, when known. */
  function refetch(name?: string) {
    refresh();
    changeListeners.forEach((listener) => listener(name));
  }

  const { localWrite, isOwnEcho } = createOwnWrites({
    userId: () => session.userId,
    onMissedUpdate: () => refetch(),
  });

  // A ToDo link write saves the initiative, so the open one is read again for its new
  // `modified`; React kept the old one and the next update write failed.
  todos.trackRecordWrites(GROWTH_DOCTYPE, async (write, nameOf) => {
    const result = await localWrite(write, nameOf);
    refetch();
    return result;
  });

  useDoctypeListUpdates(GROWTH_DOCTYPE, (update) => {
    if (isOwnEcho(update)) return;
    refetch(update.name);
    todos.refreshLinks();
  });

  const growthId = computed(() => queryString(route.query[GROWTH_PARAM]));

  function openGrowth(name: string) {
    patchQuery({ [GROWTH_PARAM]: name }, { push: true });
  }

  function closeGrowth() {
    patchQuery({ [GROWTH_PARAM]: null }, { push: true });
  }

  /** The Create / Edit dialog: open while `dialogOpen`; `editingId` is `""` when creating. */
  const dialogOpen = ref(false);
  const editingId = ref("");
  const saving = ref(false);

  function openCreate() {
    editingId.value = "";
    dialogOpen.value = true;
  }

  function openEdit(name: string) {
    editingId.value = name;
    dialogOpen.value = true;
  }

  const createCall = useCall<{ name: string }, Params>({
    url: documentUrl(GROWTH_DOCTYPE),
    method: "POST",
    immediate: false,
  });
  const editGrowth = useDocumentWrite<{ name: string }>(GROWTH_DOCTYPE, "PUT");
  const deleteGrowth = useDocumentWrite(GROWTH_DOCTYPE, "DELETE");
  const readDeleteTarget =
    useDeleteTarget<Pick<GrowthDoc, "activity">>(GROWTH_DOCTYPE);

  /** Creates the initiative, or saves the one being edited; resolves `true` once saved. */
  async function save(form: GrowthForm): Promise<boolean> {
    if (saving.value) return false;
    const name = editingId.value;
    saving.value = true;
    try {
      await localWrite(
        () =>
          name
            ? editGrowth(name, editGrowthPayload(form))
            : createCall.submit(
                createGrowthPayload(
                  projectId.value,
                  form,
                  isClosingStatus(statuses.value, form.status),
                ),
              ),
        (result) => result?.name,
      );
    } catch (error) {
      if (!isAbortError(error)) toast.error(errorMessage(error));
      return false;
    } finally {
      saving.value = false;
    }
    toast.success(
      name ? "Growth initiative updated" : "Growth initiative created",
    );
    refetch();
    // A renamed initiative's ToDo chips show its new title.
    if (name) todos.refreshLinks();
    return true;
  }

  /** Reads the initiative for its title and linked ToDos, then confirms. */
  async function requestDelete(name: string) {
    const { doc, hasTodos } = await readDeleteTarget(name);
    dialog.danger({
      title: "Delete growth initiative",
      message: deleteRecordMessage(
        "growth initiative",
        doc?.activity ?? name,
        hasTodos,
      ),
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await localWrite(
            () => deleteGrowth(name),
            () => name,
          );
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("Growth initiative deleted");
        if (growthId.value) closeGrowth();
        refresh();
        todos.refreshLinks();
      },
    });
  }

  const openStatusList = computed(() => openStatuses(statuses.value));

  return {
    filters,
    sort,
    hasActiveFilters: computed(() => hasActiveFilters(filters)),
    clearFilters: () => Object.assign(filters, EMPTY_GROWTH_FILTERS),
    activityOwnerOptions: computed(() =>
      ownerFilterOptions(people.value.activityOwners, users.value),
    ),
    ideationOwnerOptions: computed(() =>
      ownerFilterOptions(people.value.ideationOwners, users.value),
    ),
    /** The statuses of type Status. */
    statuses: openStatusList,
    closedStatuses: computed(() => closedStatuses(statuses.value)),
    categories: computed(() => categoryRows.data ?? []),
    mastersLoading: computed(() => statusRows.loading || categoryRows.loading),
    isClosing: (status: string) => isClosingStatus(statuses.value, status),
    items,
    groups: computed(() => growthGroups(items.value)),
    /** A first load or a filter or sort change is being read; background reloads don't count. */
    loading: computed(
      () => list.loading && (!list.data || loadedQuery.value !== query.value),
    ),
    /** The list couldn't be read and there's nothing to show; a failed background reload keeps the rows. */
    loadError: computed(() =>
      list.error && !isAbortError(list.error) && !list.data ? list.error : null,
    ),
    refresh,
    onGrowthChanged,
    localWrite,
    /** The initiative open in the detail view (`?growth=`), or `""`. */
    growthId,
    openGrowth,
    closeGrowth,
    dialogOpen,
    editingId,
    saving,
    openCreate,
    openEdit,
    save,
    requestDelete,
  };
}

export type GrowthState = ReturnType<typeof createGrowth>;

const growthKey: InjectionKey<GrowthState> = Symbol("growth");

/**
 * The Growth tab's state, provided by `GrowthTab`: the owner, status and category
 * filters and the sort (local, as React), the project's initiatives with their owners,
 * the status and category masters, the open initiative (`?growth=`), the Create / Edit
 * dialog and deletes. The list is read again after every write, ToDo link writes
 * included, and on realtime changes by others, and so are the listeners of
 * `onGrowthChanged`.
 */
export function provideGrowth(): GrowthState {
  const growth = createGrowth();
  provide(growthKey, growth);
  return growth;
}

export function useGrowth(): GrowthState {
  const growth = inject(growthKey);
  if (!growth) throw new Error("useGrowth() needs provideGrowth() in a parent");
  return growth;
}
