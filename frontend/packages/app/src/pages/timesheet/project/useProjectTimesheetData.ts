/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { addDays, parseISO } from "date-fns";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { buildCompositeFilters } from "@/lib/utils";
import { formatTimesheetWeekLabel } from "../utils";
import type { ProjectMemberData, WeekGroup } from "./context";
import type { ApiPayload, ProjectTimesheetApiResponse } from "./types";

type UseProjectTimesheetDataResult = {
  hasMore: boolean;
  isLoadingProjectData: boolean;
  weekGroups: WeekGroup[];
  loadData: () => void;
  error: FrappeError | undefined;
  resetData: () => void;
};

type UseProjectTimesheetOptions = {
  requestKey: string;
  search: string;
  compositeFilters: FilterCondition[];
};

const PROJECT_PAGE_LENGTH = 10;

export function useProjectTimesheetData({
  requestKey,
  search,
  compositeFilters,
}: UseProjectTimesheetOptions): UseProjectTimesheetDataResult {
  const [weekDate, setWeekDate] = useState(getTodayDate());
  const [projectStart, setProjectStart] = useState(0);
  const [appliedRequestKey, setAppliedRequestKey] = useState(requestKey);

  // Each entry represents one paginated fetch.
  // All derived data (weeks, projects, members) is computed from this.
  const [pages, setPages] = useState<ApiPayload[]>([]);

  // Build Frappe-compatible filters from composite filters
  const { startDate, endDate, frappeFilters } = useMemo(
    () => buildCompositeFilters(compositeFilters),
    [compositeFilters],
  );
  const isApplyingNewFilters = requestKey !== appliedRequestKey;
  const requestWeekDate = isApplyingNewFilters
    ? (startDate ?? getTodayDate())
    : weekDate;
  const requestProjectStart = isApplyingNewFilters ? 0 : projectStart;

  const resetData = useCallback(() => {
    setPages([]);
    // When a date-range filter is active, start the sliding window at the
    // filter's end date (startDate) so week pagination walks backward through
    // the filtered range instead of from today.
    setWeekDate(startDate ?? getTodayDate());
    setProjectStart(0);
  }, [startDate]);

  // Reset pagination when filters change
  useEffect(() => {
    if (!isApplyingNewFilters) {
      return;
    }

    resetData();
    setAppliedRequestKey(requestKey);
  }, [isApplyingNewFilters, requestKey, resetData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will eventually use filters in the API call, just not yet.
  const hasActiveFilter = !!search || compositeFilters.length > 0;

  const {
    data: projectTimesheetData,
    error: projectTimesheetError,
    isLoading: isLoadingProjectApiData,
  } = useFrappeGetCall<ProjectTimesheetApiResponse>(
    "next_pms.timesheet.api.project.get_project_timesheet_data",
    {
      date: requestWeekDate,
      max_week: NUMBER_OF_WEEKS_TO_FETCH,
      page_length: PROJECT_PAGE_LENGTH,
      start: requestProjectStart,
      search: search || null,
      filters: frappeFilters.length > 0 ? JSON.stringify(frappeFilters) : null,
      // skip_empty_weeks: hasActiveFilter || null,
      // TODO: Re-enable skip_empty_weeks once the API properly supports it.
    },
  );

  useEffect(() => {
    if (!projectTimesheetData?.message) {
      return;
    }
    setPages((prev) => [...prev, projectTimesheetData.message as ApiPayload]);
  }, [projectTimesheetData]);

  // All transformation lives here. Because this is pure data derivation (no side effects).
  const { hasMoreProjects, hasMoreWeeks, hasMore, weekGroups } = useMemo(() => {
    const oneYearAgo = addDays(parseISO(getTodayDate()), -365);
    // When a date-range filter is active, limit week pagination to the actual
    // filter range. Without a filter, fall back
    // to the 1-year rolling limit.
    const hasMoreWeeks =
      startDate && endDate
        ? addDays(parseISO(requestWeekDate), -(NUMBER_OF_WEEKS_TO_FETCH * 7)) >
          parseISO(endDate)
        : parseISO(requestWeekDate) > oneYearAgo;

    const hasMoreProjects =
      pages.length > 0 ? (pages[pages.length - 1].has_more ?? false) : true;

    const weekMap = new Map<string, WeekGroup>();
    const projectMemberDedup = new Map<string, Set<string>>();

    pages.forEach((page) => {
      (page.week_groups ?? []).forEach((week) => {
        if (!weekMap.has(week.start_date)) {
          weekMap.set(week.start_date, {
            key: week.key,
            label: formatTimesheetWeekLabel(week.start_date, week.end_date),
            start_date: week.start_date,
            end_date: week.end_date,
            dates: week.dates,
            projects: [],
          });
        }

        const targetWeek = weekMap.get(week.start_date)!;

        week.projects.forEach((project) => {
          let targetProject = targetWeek.projects.find(
            (weekProject) => weekProject.project === project.project,
          );

          if (!targetProject) {
            targetProject = {
              project: project.project,
              projectName: project.project_name,
              members: [],
            };
            targetWeek.projects.push(targetProject);
          }

          const dedupKey = `${week.start_date}::${project.project}`;
          if (!projectMemberDedup.has(dedupKey)) {
            projectMemberDedup.set(dedupKey, new Set());
          }

          const memberSet = projectMemberDedup.get(dedupKey)!;
          project.members.forEach((member) => {
            if (memberSet.has(member.employee)) {
              return;
            }

            memberSet.add(member.employee);
            const mappedMember: ProjectMemberData = {
              label: member.label,
              employee: member.employee,
              avatarUrl: member.avatar_url,
              tasks: member.tasks,
              holidays: member.holidays,
              leaves: member.leaves,
              workingHour: member.working_hour,
              workingFrequency: member.working_frequency,
              status: member.status,
            };

            targetProject.members.push(mappedMember);
          });
        });
      });
    });

    const weekGroups = Array.from(weekMap.values())
      .sort(
        (a, b) =>
          parseISO(b.start_date).getTime() - parseISO(a.start_date).getTime(),
      )
      .map((week) => ({
        ...week,
        projects: [...week.projects].sort((a, b) =>
          (a.projectName || a.project).localeCompare(
            b.projectName || b.project,
          ),
        ),
      }));

    const hasMore = hasMoreProjects || hasMoreWeeks;

    return { hasMoreProjects, hasMoreWeeks, hasMore, weekGroups };
  }, [pages, requestWeekDate, startDate, endDate]);

  // When the current window is fully loaded but yields no visible weeks, we are
  // about to auto-advance. Expose this as "still loading" to prevent a flicker
  // where the consumer briefly sees an empty / "No Data" state before the next
  // fetch starts.
  const isAutoAdvancing =
    !isLoadingProjectApiData &&
    pages.length > 0 &&
    !hasMoreProjects &&
    weekGroups.length === 0 &&
    hasMoreWeeks;

  // Auto-advance the week window when a fully-loaded window yields no visible
  // weeks (all employees have "Not Submitted" timesheets for that range).
  // This prevents a "No Data" screen when data exists in older date ranges,
  // which happens frequently when skip_empty_weeks is active with a filter.
  useEffect(() => {
    if (isLoadingProjectApiData) return;
    if (pages.length === 0) return;
    if (hasMoreProjects) return; // current window not fully loaded yet
    if (weekGroups.length > 0) return; // we have visible data
    if (!hasMoreWeeks) return;

    setWeekDate((prev) =>
      getFormatedDate(addDays(parseISO(prev), -(NUMBER_OF_WEEKS_TO_FETCH * 7))),
    );
    setProjectStart(0);
  }, [
    isLoadingProjectApiData,
    hasMoreProjects,
    hasMoreWeeks,
    weekGroups.length,
    pages.length,
  ]);

  // Unified loadData: prioritizes project pagination, then week pagination.
  const loadData = useCallback(() => {
    if (isLoadingProjectApiData) return;

    // Priority 1: Load more projects for current date range
    if (hasMoreProjects) {
      setProjectStart((prev) => prev + PROJECT_PAGE_LENGTH);
      return;
    }

    // Priority 2: Load more weeks (with project pagination reset).
    // Advance by the fixed batch window from the current weekDate so we always
    // produce a new date value.
    if (hasMoreWeeks) {
      setWeekDate((prev) =>
        getFormatedDate(
          addDays(parseISO(prev), -(NUMBER_OF_WEEKS_TO_FETCH * 7)),
        ),
      );
      setProjectStart(0);
    }
  }, [hasMoreProjects, hasMoreWeeks, isLoadingProjectApiData]);

  return {
    hasMore,
    isLoadingProjectData:
      isLoadingProjectApiData || isAutoAdvancing || pages.length === 0,
    weekGroups,
    loadData,
    error: projectTimesheetError,
    resetData,
  };
}
