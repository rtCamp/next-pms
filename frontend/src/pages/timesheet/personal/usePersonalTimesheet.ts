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
import { dayjs, toast, useCall } from "frappe-ui";
import { useSocket } from "@/socket";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import { PERSONAL_WEEKS_PER_PAGE } from "@/pages/timesheet/constants";
import type { LikedTask, TimesheetData } from "@/pages/timesheet/types";
import { useTimesheetFilters } from "@/pages/timesheet/useTimesheetFilters";
import {
  addWeekLabels,
  mergeTimesheetData,
  nextPageStartDate,
} from "@/pages/timesheet/utils";

type TimesheetParams = Record<string, string | number | boolean | undefined>;

interface Page {
  /** Date the page was requested back from (`start_date`). */
  startDate: string;
  payload: TimesheetData;
}

/** A new query (first page, earlier pages kept on screen) or the next page. */
type RequestKind = "query" | "next";

const EMPTY_DATA: TimesheetData = {
  working_hour: 0,
  working_frequency: "Per Day",
  data: {},
  leaves: [],
  holidays: [],
};

/** How far back paging looks for filtered weeks before it stops. */
const EMPTY_SKIP_LIMIT_DAYS = 365;

function createPersonalTimesheet() {
  const session = useSession();
  const socket = useSocket();
  const timesheetFilters = useTimesheetFilters({
    approvalStatus: true,
    weeksPerPage: PERSONAL_WEEKS_PER_PAGE,
  });
  const { filters, query, requestApprovalStatus } = timesheetFilters;

  const pageCall = useCall<TimesheetData, TimesheetParams>({
    url: "/api/v2/method/next_pms.timesheet.api.timesheet.get_timesheet_data",
    immediate: false,
  });
  // Realtime reloads go through their own call, so they don't abort a page load.
  const refreshCall = useCall<TimesheetData, TimesheetParams>({
    url: "/api/v2/method/next_pms.timesheet.api.timesheet.get_timesheet_data",
    immediate: false,
  });
  const likedTasks = useCall<LikedTask[]>({
    url: "/api/v2/method/next_pms.timesheet.api.task.get_liked_tasks",
  });

  const pages = ref<Page[]>([]);
  const pending = ref<RequestKind | null>(null);
  // Set after a failed request so a still-visible sentinel can't retry it in a loop.
  const failed = ref(false);
  let latestRequest = 0;

  const filtersAreActive = computed(
    () =>
      filters.value.search.trim().length > 0 ||
      requestApprovalStatus.value.length > 0 ||
      query.value.filters.length > 0 ||
      query.value.dateBounded,
  );

  // GET params go through URLSearchParams, so lists are sent as JSON strings.
  const queryParams = computed<TimesheetParams>(() => ({
    employee: session.employee ?? "",
    max_week: query.value.maxWeek,
    search: filters.value.search,
    approval_status: requestApprovalStatus.value.length
      ? JSON.stringify(requestApprovalStatus.value)
      : undefined,
    filters: JSON.stringify(query.value.filters),
    skip_empty_weeks: filtersAreActive.value,
  }));

  const timesheetData = computed<TimesheetData>(
    () =>
      pages.value.reduce<TimesheetData | null>((current, page) => {
        const labelled = addWeekLabels(page.payload);
        return current ? mergeTimesheetData(current, labelled) : labelled;
      }, null) ?? EMPTY_DATA,
  );

  const nextStartDate = computed(() => {
    const last = pages.value.at(-1);
    return nextPageStartDate(
      last?.payload,
      last?.startDate,
      query.value.maxWeek,
    );
  });

  const hasMoreWeeks = computed(() => {
    if (failed.value) return false;
    if (!filtersAreActive.value) return true;
    const oldestWeek = Object.values(timesheetData.value.data).at(-1);
    const limit = dayjs(oldestWeek?.start_date ?? query.value.weekDate)
      .subtract(EMPTY_SKIP_LIMIT_DAYS, "day")
      .format("YYYY-MM-DD");
    return Boolean(
      !query.value.dateBounded &&
      nextStartDate.value &&
      nextStartDate.value > limit &&
      pages.value.at(-1)?.payload.has_more,
    );
  });

  async function fetchPage(startDate: string, kind: RequestKind) {
    const request = ++latestRequest;
    pending.value = kind;
    let response: TimesheetData | null;
    try {
      response = await pageCall.submit({
        ...queryParams.value,
        start_date: startDate,
      });
    } catch (error) {
      if (request !== latestRequest) return;
      pending.value = null;
      failed.value = true;
      toast.error(errorMessage(error));
      return;
    }
    if (request !== latestRequest || !response) return;
    pending.value = null;
    failed.value = false;
    const page = { startDate, payload: response };
    pages.value = kind === "next" ? [...pages.value, page] : [page];
  }

  function loadMore() {
    if (pending.value || !hasMoreWeeks.value || !nextStartDate.value) return;
    fetchPage(nextStartDate.value, "next");
  }

  // Compared as JSON: the query is rebuilt on every route change.
  watch(
    () => JSON.stringify([queryParams.value, query.value.weekDate]),
    () => {
      if (session.employee) fetchPage(query.value.weekDate, "query");
    },
    { immediate: true },
  );

  function pageHasWeek(page: Page, weekKey: string) {
    return Object.prototype.hasOwnProperty.call(page.payload.data, weekKey);
  }

  /** Reloads the pages holding the week, for a filtered view the week may now leave. */
  async function refreshPagesWithWeek(weekKey: string) {
    const request = latestRequest;
    for (const [index, page] of pages.value.entries()) {
      if (!pageHasWeek(page, weekKey)) continue;
      const response = await refreshCall
        .submit({ ...queryParams.value, start_date: page.startDate })
        .catch(() => null);
      // A new query replaced the pages meanwhile.
      if (!response || request !== latestRequest) return;
      pages.value = pages.value.map((current, at) =>
        at === index ? { ...current, payload: response } : current,
      );
    }
  }

  function mergeWeek(payload: TimesheetData, weekKey: string) {
    pages.value = pages.value.map((page) =>
      pageHasWeek(page, weekKey)
        ? { ...page, payload: mergeTimesheetData(page.payload, payload) }
        : page,
    );
  }

  const realtimeEvent = computed(() => `timesheet_update::${session.employee}`);

  function onTimesheetUpdate(event: { message?: TimesheetData }) {
    const payload = event?.message;
    const weekKey = Object.keys(payload?.data ?? {})[0];
    if (!payload || !weekKey) return;
    if (filtersAreActive.value) refreshPagesWithWeek(weekKey);
    else mergeWeek(payload, weekKey);
  }

  watch(
    realtimeEvent,
    (event, previous) => {
      if (previous) socket.off(previous, onTimesheetUpdate);
      socket.on(event, onTimesheetUpdate);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => socket.off(realtimeEvent.value, onTimesheetUpdate));

  const loaded = computed(() => pages.value.length > 0);

  return reactive({
    ...timesheetFilters,
    timesheetData,
    likedTasks: computed(() => likedTasks.data ?? []),
    hasMoreWeeks,
    /** First load: nothing to show yet. */
    isInitialLoad: computed(() => !loaded.value && pending.value === "query"),
    /** A new query is loading while the previous weeks stay on screen. */
    isFilterRequest: computed(() => loaded.value && pending.value === "query"),
    isLoading: computed(() => pending.value !== null),
    /** A filter that narrows the tasks, which hides the week totals. */
    hasTaskFilter: computed(
      () =>
        filters.value.search !== "" ||
        filters.value.compositeFilters.some(
          (condition) =>
            condition.fieldCategory === "Task" || condition.field === "subject",
        ),
    ),
    loadMore,
    refetchLikedTasks: () => likedTasks.reload(),
  });
}

export type PersonalTimesheet = ReturnType<typeof createPersonalTimesheet>;

const personalTimesheetKey: InjectionKey<PersonalTimesheet> =
  Symbol("personalTimesheet");

/** Creates the personal page's data and shares it with the components below. */
export function providePersonalTimesheet(): PersonalTimesheet {
  const timesheet = createPersonalTimesheet();
  provide(personalTimesheetKey, timesheet);
  return timesheet;
}

/** The personal page's data, provided by the page. */
export function usePersonalTimesheet(): PersonalTimesheet {
  const timesheet = inject(personalTimesheetKey);
  if (!timesheet) {
    throw new Error(
      "usePersonalTimesheet() needs providePersonalTimesheet() in a parent",
    );
  }
  return timesheet;
}
