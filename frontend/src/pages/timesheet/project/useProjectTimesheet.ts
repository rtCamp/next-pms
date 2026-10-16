import {
  computed,
  inject,
  onBeforeUnmount,
  provide,
  reactive,
  ref,
  watch,
  type InjectionKey,
} from "vue";
import { toast, useCall } from "frappe-ui";
import { useSocket } from "@/socket";
import { errorMessage } from "@/utils/errors";
import { PROJECT_WEEKS_PER_PAGE } from "@/pages/timesheet/constants";
import { useTimesheetFilters } from "@/pages/timesheet/useTimesheetFilters";
import { formatTimesheetWeekLabel } from "@/pages/timesheet/utils";
import type {
  ProjectFilterArgs,
  ProjectMemberWeekPayload,
  ProjectTimesheetInfoEvent,
  ProjectWeeksPayload,
} from "./types";

type WeeksParams = ProjectFilterArgs & { date: string; max_week: number };

interface Page {
  /** Date the page was requested back from. */
  date: string;
  payload: ProjectWeeksPayload;
}

/** A new query (first page, earlier weeks kept on screen) or the next page. */
type RequestKind = "query" | "next";

/** Applies a realtime employee-week (or, with `null`, reloads) in the week it belongs to. */
export type ProjectRefreshHandler = (
  payload: ProjectMemberWeekPayload | null,
) => void;

const WEEKS_URL =
  "/api/v2/method/next_pms.timesheet.api.project.get_project_timesheet_weeks";

function createProjectTimesheet() {
  const socket = useSocket();
  const timesheetFilters = useTimesheetFilters({
    weeksPerPage: PROJECT_WEEKS_PER_PAGE,
  });
  const { filters, query } = timesheetFilters;

  const pageCall = useCall<ProjectWeeksPayload, WeeksParams>({
    url: WEEKS_URL,
    immediate: false,
  });
  // Realtime reloads go through their own call, so they don't abort a page load.
  const refreshCall = useCall<ProjectWeeksPayload, WeeksParams>({
    url: WEEKS_URL,
    immediate: false,
  });

  const filterArgs = computed<ProjectFilterArgs>(() => ({
    search: filters.value.search || undefined,
    filters: query.value.filters.length
      ? JSON.stringify(query.value.filters)
      : undefined,
  }));

  const hasActiveFilter = computed(() =>
    Boolean(filterArgs.value.search || filterArgs.value.filters),
  );

  const queryParams = computed(() => ({
    ...filterArgs.value,
    max_week: query.value.maxWeek,
  }));

  /** Identifies the query; compared as JSON since it is rebuilt on every route change. */
  const queryKey = computed(() =>
    JSON.stringify([queryParams.value, query.value.weekDate]),
  );

  const pages = ref<Page[]>([]);
  /** The query the shown pages answer, and its filter arguments for the projects. */
  const loaded = ref<{ key: string; filterArgs: ProjectFilterArgs } | null>(
    null,
  );
  const pending = ref<RequestKind | null>(null);
  let latestRequest = 0;

  const weeks = computed(() =>
    pages.value
      .flatMap((page) => page.payload.weeks)
      .map((week) => ({
        ...week,
        label: formatTimesheetWeekLabel(week.start_date, week.end_date),
      }))
      .sort((a, b) => b.start_date.localeCompare(a.start_date)),
  );

  const hasMoreWeeks = computed(
    () =>
      !query.value.dateBounded &&
      Boolean(pages.value.at(-1)?.payload.has_more_weeks),
  );

  async function fetchPage(date: string, kind: RequestKind) {
    const request = ++latestRequest;
    const key = queryKey.value;
    const args = filterArgs.value;
    pending.value = kind;
    let response: ProjectWeeksPayload | null;
    try {
      response = await pageCall.submit({ ...queryParams.value, date });
    } catch (error) {
      if (request !== latestRequest) return;
      pending.value = null;
      toast.error(errorMessage(error));
      return;
    }
    if (request !== latestRequest || !response) return;
    pending.value = null;
    const page = { date, payload: response };
    if (kind === "next") {
      pages.value = [...pages.value, page];
      return;
    }
    pages.value = [page];
    loaded.value = { key, filterArgs: args };
  }

  function loadMore() {
    const nextDate = pages.value.at(-1)?.payload.next_date;
    if (pending.value || !hasMoreWeeks.value || !nextDate) return;
    fetchPage(nextDate, "next");
  }

  watch(queryKey, () => fetchPage(query.value.weekDate, "query"), {
    immediate: true,
  });

  /** Reloads every loaded page, as a realtime update can change which weeks match. */
  async function refreshWeeks() {
    const request = latestRequest;
    for (const [index, page] of pages.value.entries()) {
      const response = await refreshCall
        .submit({ ...queryParams.value, date: page.date })
        .catch(() => null);
      // A new query replaced the pages meanwhile.
      if (!response || request !== latestRequest) return;
      pages.value = pages.value.map((current, at) =>
        at === index ? { ...current, payload: response } : current,
      );
    }
  }

  // Open weeks register here, so a realtime update can reach the week's projects.
  const projectRefreshers = new Map<string, ProjectRefreshHandler>();

  function registerProjectRefresh(
    weekStartDate: string,
    handler: ProjectRefreshHandler,
  ) {
    projectRefreshers.set(weekStartDate, handler);
    return () => {
      if (projectRefreshers.get(weekStartDate) === handler) {
        projectRefreshers.delete(weekStartDate);
      }
    };
  }

  function onProjectTimesheetInfo(event: ProjectTimesheetInfoEvent) {
    const startDate = event?.start_date;
    if (!startDate) return;
    const week = weeks.value.find((week) => week.dates.includes(startDate));
    if (!week) return;
    projectRefreshers.get(week.start_date)?.(event.message ?? null);
    if (hasActiveFilter.value) refreshWeeks();
  }

  socket.on("project_timesheet_info", onProjectTimesheetInfo);
  onBeforeUnmount(() =>
    socket.off("project_timesheet_info", onProjectTimesheetInfo),
  );

  const isLoaded = computed(() => loaded.value !== null);

  return reactive({
    ...timesheetFilters,
    weeks,
    hasMoreWeeks,
    /** Key of the query the shown weeks answer; weeks remount when it changes. */
    loadedKey: computed(() => loaded.value?.key ?? ""),
    /** Filter arguments of the shown weeks, for loading their projects. */
    loadedFilterArgs: computed(() => loaded.value?.filterArgs ?? {}),
    /** First load: nothing to show yet. */
    isInitialLoad: computed(() => !isLoaded.value && pending.value === "query"),
    /** A new query is loading while the previous weeks stay on screen. */
    isFilterRequest: computed(
      () => isLoaded.value && pending.value === "query",
    ),
    isLoading: computed(() => pending.value !== null),
    loadMore,
    registerProjectRefresh,
  });
}

export type ProjectTimesheet = ReturnType<typeof createProjectTimesheet>;

const projectTimesheetKey: InjectionKey<ProjectTimesheet> =
  Symbol("projectTimesheet");

/** Creates the project page's data and shares it with the components below. */
export function provideProjectTimesheet(): ProjectTimesheet {
  const timesheet = createProjectTimesheet();
  provide(projectTimesheetKey, timesheet);
  return timesheet;
}

/** The project page's data, provided by the page. */
export function useProjectTimesheet(): ProjectTimesheet {
  const timesheet = inject(projectTimesheetKey);
  if (!timesheet) {
    throw new Error(
      "useProjectTimesheet() needs provideProjectTimesheet() in a parent",
    );
  }
  return timesheet;
}
