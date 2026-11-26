import {
  computed,
  reactive,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { PROJECT_PAGE_LENGTH } from "@/pages/timesheet/constants";
import type {
  ProjectFilterArgs,
  ProjectMemberWeekPayload,
  ProjectWeekProjectsPayload,
} from "./types";
import { applyRealtimeToPages } from "./utils";

type ProjectsParams = ProjectFilterArgs & {
  start_date: string;
  page_length: number;
  start: number;
};

interface UseProjectWeekProjectsOptions {
  /** Any day of the week, normally its first. */
  startDate: string;
  filterArgs: ProjectFilterArgs;
  /** Projects load once this is true, i.e. once the week is opened. */
  enabled: MaybeRefOrGetter<boolean>;
}

const PROJECTS_URL =
  "/api/v2/method/next_pms.timesheet.api.project.get_project_timesheet_data";

/** One project week's projects with their members, 4 a page, loaded when the week first opens. */
export function useProjectWeekProjects(options: UseProjectWeekProjectsOptions) {
  const call = useCall<ProjectWeekProjectsPayload, ProjectsParams>({
    url: PROJECTS_URL,
    immediate: false,
  });
  // Realtime reloads go through their own call, so they don't abort a page load.
  const reloadCall = useCall<ProjectWeekProjectsPayload, ProjectsParams>({
    url: PROJECTS_URL,
    immediate: false,
  });

  const pages = ref<ProjectWeekProjectsPayload[]>([]);
  const loading = ref(false);
  // Set after a failed request so a still-visible sentinel can't retry it in a loop.
  const failed = ref(false);
  let reloadRequest = 0;

  const projects = computed(() => pages.value.flatMap((page) => page.projects));
  const hasMore = computed(
    () => !failed.value && Boolean(pages.value.at(-1)?.has_more),
  );
  const hasActiveFilter = Boolean(
    options.filterArgs.search || options.filterArgs.filters,
  );

  function params(index: number): ProjectsParams {
    return {
      ...options.filterArgs,
      start_date: options.startDate,
      page_length: PROJECT_PAGE_LENGTH,
      start: index * PROJECT_PAGE_LENGTH,
    };
  }

  async function fetchPage(index: number) {
    loading.value = true;
    try {
      const page = await call.submit(params(index));
      failed.value = false;
      // A reload may have replaced the pages meanwhile.
      if (page && pages.value.length === index) {
        pages.value = [...pages.value, page];
      }
    } catch (error) {
      failed.value = true;
      toast.error(errorMessage(error));
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => toValue(options.enabled),
    (enabled) => {
      if (enabled && pages.value.length === 0 && !loading.value) fetchPage(0);
    },
    { immediate: true },
  );

  function loadMore() {
    if (loading.value || !hasMore.value) return;
    fetchPage(pages.value.length);
  }

  /** Reloads every loaded page. */
  async function reload() {
    const request = ++reloadRequest;
    const count = pages.value.length;
    const reloaded: ProjectWeekProjectsPayload[] = [];
    for (let index = 0; index < count; index++) {
      const page = await reloadCall.submit(params(index)).catch(() => null);
      if (!page || request !== reloadRequest) return;
      reloaded.push(page);
      if (!page.has_more) break;
    }
    pages.value = reloaded;
  }

  /**
   * Applies a realtime update of one employee's week. Without a payload (the site-wide
   * invalidation), with a filter on, or when a project appears or drops out, the loaded
   * pages are reloaded instead.
   */
  function refreshEmployeeWeek(payload: ProjectMemberWeekPayload | null) {
    if (pages.value.length === 0) return;
    const patched =
      payload && !hasActiveFilter
        ? applyRealtimeToPages(pages.value, payload)
        : null;
    if (patched) pages.value = patched;
    else reload();
  }

  return reactive({
    projects,
    hasMore,
    loading,
    loadMore,
    refreshEmployeeWeek,
  });
}
