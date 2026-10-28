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
import type { FilterCondition } from "@/components/Filter";
import type { SortState } from "@/components/SortSelector";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { createOwnWrites } from "@/pages/project-details/ownWrites";
import { GET_LIST_URL } from "@/pages/project-details/shared/constants";
import {
  documentUrl,
  useDocumentWrite,
} from "@/pages/project-details/shared/useDocumentWrite";
import { useUserDetails } from "@/pages/project-details/shared/useUserDetails";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { queryString } from "@/utils/query";
import {
  RISK_DOCTYPE,
  RISK_LIST_FIELDS,
  RISK_LIST_LIMIT,
  RISK_PARAM,
} from "./constants";
import {
  createRiskPayload,
  editRiskPayload,
  EMPTY_QUICK_FILTERS,
  personFilterOptions,
  quickFilterCount,
  riskGroups,
  riskListFilters,
  riskOrderBy,
  riskPeople,
  toRiskItems,
} from "./risks";
import type { RiskForm, RiskQuickFilters, RiskRow } from "./types";

type Params = Record<string, unknown>;

function createRisks() {
  const route = useRoute();
  const patchQuery = useQueryPatch();
  const session = useSession();
  const { projectId } = useProjectDetails();

  const quick = reactive<RiskQuickFilters>({ ...EMPTY_QUICK_FILTERS });
  const advanced = ref<FilterCondition[]>([]);
  const sort = ref<SortState | null>(null);

  const filters = computed(() =>
    JSON.stringify(riskListFilters(projectId.value, quick, advanced.value)),
  );

  /** The filters and sort the rows were last read for. */
  const query = computed(() => `${filters.value} ${riskOrderBy(sort.value)}`);
  const loadedQuery = ref<string | null>(null);

  const list = useCall<RiskRow[], Params>({
    url: GET_LIST_URL,
    params: () => ({
      doctype: RISK_DOCTYPE,
      fields: JSON.stringify(RISK_LIST_FIELDS),
      filters: filters.value,
      order_by: riskOrderBy(sort.value),
      limit_page_length: RISK_LIST_LIMIT,
    }),
    refetch: true,
  });
  watch(
    () => list.loading,
    (loading) => {
      if (!loading) loadedQuery.value = query.value;
    },
  );

  const peopleRows = useCall<Pick<RiskRow, "owner" | "risk_owner">[], Params>({
    url: GET_LIST_URL,
    params: () => ({
      doctype: RISK_DOCTYPE,
      fields: JSON.stringify(["owner", "risk_owner"]),
      filters: JSON.stringify([["project", "=", projectId.value]]),
      limit_page_length: RISK_LIST_LIMIT,
    }),
  });
  const people = computed(() => riskPeople(peopleRows.data ?? []));
  const users = useUserDetails(() => [
    ...people.value.owners,
    ...people.value.riskOwners,
  ]);

  const items = computed(() => toRiskItems(list.data ?? [], users.value));

  function refresh() {
    return Promise.all([list.reload(), peopleRows.reload()]);
  }

  /** The open detail's reloads, run after a change to any risk. */
  const changeListeners = new Set<(name?: string) => void>();

  /** Runs `listener` after a local or realtime change to a risk, until the caller's scope ends. */
  function onRisksChanged(listener: (name?: string) => void) {
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

  useDoctypeListUpdates(RISK_DOCTYPE, (update) => {
    if (!isOwnEcho(update)) refetch(update.name);
  });

  const riskId = computed(() => queryString(route.query[RISK_PARAM]));

  function openRisk(name: string) {
    patchQuery({ [RISK_PARAM]: name }, { push: true });
  }

  function closeRisk() {
    patchQuery({ [RISK_PARAM]: null }, { push: true });
  }

  /** The Create / Edit risk dialog: open while `dialogOpen`; `editingId` is `""` when creating. */
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
    url: documentUrl(RISK_DOCTYPE),
    method: "POST",
    immediate: false,
  });
  const editRisk = useDocumentWrite<{ name: string }>(RISK_DOCTYPE, "PUT");
  const deleteRisk = useDocumentWrite(RISK_DOCTYPE, "DELETE");

  /** Creates the risk, or saves the one being edited; resolves `true` once saved. */
  async function save(form: RiskForm): Promise<boolean> {
    if (saving.value) return false;
    const name = editingId.value;
    saving.value = true;
    try {
      await localWrite(
        () =>
          name
            ? editRisk(name, editRiskPayload(form))
            : createCall.submit(createRiskPayload(projectId.value, form)),
        (result) => result?.name,
      );
    } catch (error) {
      if (!isAbortError(error)) toast.error(errorMessage(error));
      return false;
    } finally {
      saving.value = false;
    }
    refetch();
    return true;
  }

  function requestDelete(name: string) {
    dialog.danger({
      title: "Delete risk",
      message:
        "Are you sure you want to delete this risk? This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await localWrite(
            () => deleteRisk(name),
            () => name,
          );
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("Risk deleted");
        if (riskId.value) closeRisk();
        refresh();
      },
    });
  }

  return {
    quick,
    advanced,
    sort,
    activeQuickFilters: computed(() => quickFilterCount(quick)),
    clearQuickFilters: () => Object.assign(quick, EMPTY_QUICK_FILTERS),
    riskOwnerOptions: computed(() =>
      personFilterOptions(
        "All risk owners",
        people.value.riskOwners,
        users.value,
      ),
    ),
    ownerOptions: computed(() =>
      personFilterOptions("All owners", people.value.owners, users.value),
    ),
    items,
    groups: computed(() => riskGroups(items.value)),
    /** A first load or a filter or sort change is being read; background reloads don't count. */
    loading: computed(
      () => list.loading && (!list.data || loadedQuery.value !== query.value),
    ),
    /** The list couldn't be read and there's nothing to show; a failed background reload keeps the rows. */
    loadError: computed(() =>
      list.error && !isAbortError(list.error) && !list.data ? list.error : null,
    ),
    refresh,
    onRisksChanged,
    localWrite,
    /** The risk open in the detail view (`?risk=`), or `""`. */
    riskId,
    openRisk,
    closeRisk,
    dialogOpen,
    editingId,
    saving,
    openCreate,
    openEdit,
    save,
    requestDelete,
  };
}

export type RisksState = ReturnType<typeof createRisks>;

const risksKey: InjectionKey<RisksState> = Symbol("risks");

/**
 * The Risks tab's state, provided by `RisksTab`: the quick and advanced filters and the
 * sort (local, as React), the project's risks with their owners, the open risk
 * (`?risk=`), the Create / Edit dialog and deletes. The list is read again after every
 * write and on realtime changes by others, and so are the listeners of `onRisksChanged`.
 */
export function provideRisks(): RisksState {
  const risks = createRisks();
  provide(risksKey, risks);
  return risks;
}

export function useRisks(): RisksState {
  const risks = inject(risksKey);
  if (!risks) throw new Error("useRisks() needs provideRisks() in a parent");
  return risks;
}
