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
import { TEAM_WEEKS_PER_PAGE } from "@/pages/timesheet/constants";
import { useTimesheetFilters } from "@/pages/timesheet/useTimesheetFilters";
import { formatTimesheetWeekLabel } from "@/pages/timesheet/utils";
import type {
  TeamFilterArgs,
  TeamMember,
  TeamWeeksPayload,
  TimesheetInfoEvent,
} from "./types";

type WeeksParams = TeamFilterArgs & { date: string; max_week: number };

interface Page {
  /** Date the page was requested back from. */
  date: string;
  payload: TeamWeeksPayload;
}

/** A new query (first page, earlier weeks kept on screen) or the next page. */
type RequestKind = "query" | "next";

/** Swaps a member's row in the week it belongs to. */
export type MemberRefreshHandler = (member: TeamMember) => void;

function createTeamTimesheet() {
  const socket = useSocket();
  const timesheetFilters = useTimesheetFilters({
    approvalStatus: true,
    reportsTo: true,
    weeksPerPage: TEAM_WEEKS_PER_PAGE,
  });
  const { filters, query, requestApprovalStatus } = timesheetFilters;

  const pageCall = useCall<TeamWeeksPayload, WeeksParams>({
    url: "/api/v2/method/next_pms.timesheet.api.team.get_team_timesheet_weeks",
    immediate: false,
  });
  // Realtime reloads go through their own call, so they don't abort a page load.
  const refreshCall = useCall<TeamWeeksPayload, WeeksParams>({
    url: "/api/v2/method/next_pms.timesheet.api.team.get_team_timesheet_weeks",
    immediate: false,
  });

  const filterArgs = computed<TeamFilterArgs>(() => ({
    reports_to: filters.value.reportsTo || undefined,
    search: filters.value.search || undefined,
    status_filter: requestApprovalStatus.value.length
      ? JSON.stringify(requestApprovalStatus.value)
      : undefined,
    filters: query.value.filters.length
      ? JSON.stringify(query.value.filters)
      : undefined,
  }));

  const queryParams = computed(() => ({
    ...filterArgs.value,
    max_week: query.value.maxWeek,
  }));

  /** Identifies the query; compared as JSON since it is rebuilt on every route change. */
  const queryKey = computed(() =>
    JSON.stringify([queryParams.value, query.value.weekDate]),
  );

  const pages = ref<Page[]>([]);
  /** The query the shown pages answer, and its filter arguments for the members. */
  const loaded = ref<{ key: string; filterArgs: TeamFilterArgs } | null>(null);
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
    let response: TeamWeeksPayload | null;
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

  /** Reloads every loaded page, for new counts after a member's week changed. */
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

  // Open weeks register here, so a realtime update can swap the member's row.
  const memberRefreshers = new Map<string, MemberRefreshHandler>();

  function registerMemberRefresh(
    weekStartDate: string,
    handler: MemberRefreshHandler,
  ) {
    memberRefreshers.set(weekStartDate, handler);
    return () => {
      if (memberRefreshers.get(weekStartDate) === handler) {
        memberRefreshers.delete(weekStartDate);
      }
    };
  }

  function onTimesheetInfo(event: TimesheetInfoEvent) {
    const startDate = event?.start_date;
    if (!startDate) return;
    const week = weeks.value.find((week) => week.dates.includes(startDate));
    if (!week) return;
    const refresh = memberRefreshers.get(week.start_date);
    if (refresh && event.message) refresh(event.message);
    refreshWeeks();
  }

  socket.on("timesheet_info", onTimesheetInfo);
  onBeforeUnmount(() => socket.off("timesheet_info", onTimesheetInfo));

  const isLoaded = computed(() => loaded.value !== null);

  return reactive({
    ...timesheetFilters,
    weeks,
    hasMoreWeeks,
    /** Key of the query the shown weeks answer; weeks remount when it changes. */
    loadedKey: computed(() => loaded.value?.key ?? ""),
    /** Filter arguments of the shown weeks, for loading their members. */
    loadedFilterArgs: computed(() => loaded.value?.filterArgs ?? {}),
    /** First load: nothing to show yet. */
    isInitialLoad: computed(() => !isLoaded.value && pending.value === "query"),
    /** A new query is loading while the previous weeks stay on screen. */
    isFilterRequest: computed(
      () => isLoaded.value && pending.value === "query",
    ),
    isLoading: computed(() => pending.value !== null),
    loadMore,
    registerMemberRefresh,
  });
}

export type TeamTimesheet = ReturnType<typeof createTeamTimesheet>;

const teamTimesheetKey: InjectionKey<TeamTimesheet> = Symbol("teamTimesheet");

/** Creates the team page's data and shares it with the components below. */
export function provideTeamTimesheet(): TeamTimesheet {
  const timesheet = createTeamTimesheet();
  provide(teamTimesheetKey, timesheet);
  return timesheet;
}

/** The team page's data, provided by the page. */
export function useTeamTimesheet(): TeamTimesheet {
  const timesheet = inject(teamTimesheetKey);
  if (!timesheet) {
    throw new Error(
      "useTeamTimesheet() needs provideTeamTimesheet() in a parent",
    );
  }
  return timesheet;
}
