import { computed, reactive, ref, watch } from "vue";
import { toast, useCall, useDoctype } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { errorMessage } from "@/utils/errors";
import { buildProjectFilters } from "../buildFilters";
import { KANBAN_PROJECT_LIMIT, PROJECTS_VIEW_METHOD } from "../constants";
import type { ProjectKanbanResponse } from "../types";
import { useProjectFilters } from "../useProjectFilters";

type KanbanParams = Record<string, string | number | undefined>;

/**
 * The kanban's projects, grouped by phase, for the page's filters. Sort and currency
 * don't apply to the board, as in the React page.
 */
export function useProjectKanban() {
  const { filters } = useProjectFilters();
  const kanban = useCall<ProjectKanbanResponse, KanbanParams>({
    url: `/api/v2/method/${PROJECTS_VIEW_METHOD}`,
    immediate: false,
  });
  const projects = useDoctype("Project");

  const data = ref<ProjectKanbanResponse["data"]>({});
  const loaded = ref(false);
  /** A card is being dragged; realtime reloads wait until it lands. */
  const dragging = ref(false);
  let latestRequest = 0;

  const queryParams = computed<KanbanParams>(() => {
    const frappeFilters = buildProjectFilters(filters.value);
    return {
      view: "kanban",
      search: filters.value.search || undefined,
      filters: frappeFilters.length ? JSON.stringify(frappeFilters) : undefined,
      limit: KANBAN_PROJECT_LIMIT,
    };
  });

  async function reload() {
    const request = ++latestRequest;
    // submit() rejects when the request fails; the error is read from the call below.
    const response = await kanban.submit(queryParams.value).catch(() => null);
    if (request !== latestRequest) return;
    if (!response) {
      toast.error(errorMessage(kanban.error));
      return;
    }
    data.value = response.data;
    loaded.value = true;
  }

  /** Saves a project's new phase and reloads the board; throws if the save fails. */
  async function updatePhase(projectId: string, phase: string) {
    await projects.setValue.submit({
      name: projectId,
      custom_project_phase: phase,
    });
    reload();
  }

  watch(() => JSON.stringify(queryParams.value), reload, { immediate: true });

  useDoctypeListUpdates("Project", () => {
    if (!dragging.value) reload();
  });

  return reactive({
    data,
    loaded,
    loading: computed(() => kanban.loading),
    dragging,
    reload,
    updatePhase,
  });
}
