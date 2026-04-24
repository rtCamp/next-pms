/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApprovalStatusLabelMap } from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { TeamMember } from "@/components/timesheet-row/teamTimesheetRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { buildCompositeFilters } from "@/lib/utils";
import type { DataProp, TimesheetFilters } from "@/types/timesheet";
import type { EmployeeRecord, WeekGroup } from "./context";

type WeekEntry = {
  key: string;
  start_date: string;
  end_date: string;
  dates: string[];
};

type TeamApiEmployee = {
  name: string;
  image: string | null;
  employee_name: string;
  working_hour: number;
  working_frequency: DataProp["working_frequency"];
  leaves: DataProp["leaves"];
  holidays: DataProp["holidays"];
  timesheet_details: DataProp["data"];
};

type ApiPayload = {
  data?: Record<string, TeamApiEmployee>;
  dates?: WeekEntry[];
  has_more?: boolean;
};

type UseTeamTimesheetDataResult = {
  hasMore: boolean;
  isLoadingTeamData: boolean;
  weekGroups: WeekGroup[];
  loadMore: () => void;
  handleRealtimeUpdate: (payload: ApiPayload) => void;
  error: FrappeError | undefined;
  resetData: () => void;
};

type UseTeamTimesheetOptions = {
  filters: TimesheetFilters;
  compositeFilters: FilterCondition[];
};

const EMPLOYEE_PAGE_LENGTH = 20;

export function useTeamTimesheetData({
  filters,
  compositeFilters,
}: UseTeamTimesheetOptions): UseTeamTimesheetDataResult {
  const [weekDate, setWeekDate] = useState(getTodayDate());
  const [employeeStart, setEmployeeStart] = useState(0);

  // Each entry represents one paginated fetch.
  // All derived data (weeks, members, timesheets) is computed from this.
  const [pages, setPages] = useState<ApiPayload[]>([]);

  // Track filter changes to reset pagination
  const prevFiltersRef = useRef({ filters, compositeFilters });

  // Build Frappe-compatible filters from composite filters
  const { startDate, maxWeek, frappeFilters } = useMemo(
    () => buildCompositeFilters(compositeFilters),
    [compositeFilters],
  );

  const resetData = useCallback(() => {
    setPages([]);
    // When a date-range filter is active, start the sliding window at the
    // filter's end date (startDate) so week pagination walks backward through
    // the filtered range instead of from today.
    setWeekDate(startDate ?? getTodayDate());
    setEmployeeStart(0);
  }, [startDate]);

  // Reset pagination when filters change
  useEffect(() => {
    const filtersChanged =
      JSON.stringify(prevFiltersRef.current.filters) !==
        JSON.stringify(filters) ||
      JSON.stringify(prevFiltersRef.current.compositeFilters) !==
        JSON.stringify(compositeFilters);

    if (filtersChanged) {
      resetData();
      prevFiltersRef.current = { filters, compositeFilters };
    }
  }, [filters, compositeFilters, resetData]);

  const hasActiveFilter =
    !!filters.reportsTo ||
    !!filters.search ||
    !!filters.approvalStatus ||
    compositeFilters.length > 0;

  const {
    data: teamData,
    error: teamDataError,
    isLoading: isLoadingTeamApiData,
  } = useFrappeGetCall("next_pms.timesheet.api.team.get_team_timesheet_data", {
    date: weekDate,
    reports_to: filters.reportsTo || null,
    max_week: NUMBER_OF_WEEKS_TO_FETCH,
    page_length: EMPLOYEE_PAGE_LENGTH,
    start: employeeStart,
    search: filters.search || null,
    status_filter: filters.approvalStatus
      ? JSON.stringify([ApprovalStatusLabelMap[filters.approvalStatus]])
      : null,
    filters: frappeFilters.length > 0 ? JSON.stringify(frappeFilters) : null,
    skip_empty_weeks: hasActiveFilter || null,
  });

  useEffect(() => {
    if (!teamData?.message) {
      return;
    }
    setPages((prev) => [...prev, teamData.message as ApiPayload]);
  }, [teamData]);

  // All transformation lives here. Because this is pure data derivation (no side effects).
  const { hasMoreWeeks, hasMoreEmployees, hasMore, weekGroups } =
    useMemo(() => {
      const oneYearAgo = addDays(new Date(getTodayDate()), -365);
      // When a date-range filter is active, limit week pagination to the actual
      // filter range (startDate − maxWeek weeks). Without a filter, fall back
      // to the 1-year rolling limit.
      const hasMoreWeeks = startDate
        ? new Date(weekDate) > addDays(new Date(startDate), -(maxWeek * 7))
        : new Date(weekDate) > oneYearAgo;
      const hasMoreEmployees =
        pages.length > 0 ? (pages[pages.length - 1].has_more ?? false) : true;

      type EmployeeState = {
        member: EmployeeRecord;
        working_hour: number;
        working_frequency: DataProp["working_frequency"];
        timesheetDetails: DataProp["data"];
        leaves: DataProp["leaves"];
        holidays: DataProp["holidays"];
      };
      const employeeMap: Record<string, EmployeeState> = {};

      pages.forEach((payload) => {
        Object.values(payload.data ?? {})
          .filter((emp) => emp.name)
          .forEach((emp) => {
            // Eliminate "Not Submitted" weeks at the source so all downstream
            // logic can assume every timesheet entry is worth displaying.
            const submittedTimesheets = Object.fromEntries(
              Object.entries(emp.timesheet_details ?? {}).filter(
                ([, week]) => week.status !== "Not Submitted",
              ),
            );

            if (!employeeMap[emp.name]) {
              employeeMap[emp.name] = {
                member: {
                  name: emp.name,
                  employee_name: emp.employee_name,
                  image: emp.image,
                },
                working_hour: emp.working_hour,
                working_frequency: emp.working_frequency,
                timesheetDetails: submittedTimesheets,
                leaves: emp.leaves ?? [],
                holidays: emp.holidays ?? [],
              };
            } else {
              // Merge subsequent pages for the same employee, deduplicating leaves and holidays
              // by their unique identifiers to avoid double-rendering on overlapping date ranges.
              const existing = employeeMap[emp.name];
              const existingLeaveIds = new Set(
                existing.leaves.map((l) => l.name),
              );
              const existingHolidayDates = new Set(
                existing.holidays.map((h) => h.holiday_date),
              );
              employeeMap[emp.name] = {
                ...existing,
                timesheetDetails: {
                  ...existing.timesheetDetails,
                  ...submittedTimesheets,
                },
                leaves: [
                  ...existing.leaves,
                  ...(emp.leaves ?? []).filter(
                    (l) => !existingLeaveIds.has(l.name),
                  ),
                ],
                holidays: [
                  ...existing.holidays,
                  ...(emp.holidays ?? []).filter(
                    (h) => !existingHolidayDates.has(h.holiday_date),
                  ),
                ],
              };
            }
          });
      });

      const weekMap = new Map<string, WeekGroup>();

      Object.values(employeeMap).forEach(
        ({
          member,
          working_hour,
          working_frequency,
          timesheetDetails,
          leaves,
          holidays,
        }) => {
          Object.values(timesheetDetails).forEach((week) => {
            const weekId = week.start_date;
            if (!weekMap.has(weekId)) {
              weekMap.set(weekId, {
                key: week.key,
                start_date: week.start_date,
                end_date: week.end_date,
                dates: week.dates,
                members: [],
                approvalPendingCount: 0,
              });
            }
            const targetWeek = weekMap.get(weekId)!;
            if (week.status === "Approval Pending") {
              targetWeek.approvalPendingCount += 1;
            }
            targetWeek.members.push({
              label: member.employee_name,
              employee: member.name,
              avatarUrl: member.image ?? undefined,
              tasks: week.tasks,
              leaves,
              holidays,
              workingHour: working_hour,
              workingFrequency: working_frequency,
              status: week.status,
            } satisfies TeamMember);
          });
        },
      );

      const weekGroups = Array.from(weekMap.values()).sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      );

      const hasMore = hasMoreEmployees || hasMoreWeeks;

      return { hasMoreWeeks, hasMoreEmployees, hasMore, weekGroups };
    }, [pages, weekDate, startDate, maxWeek]);

  // Auto-advance the week window when a fully-loaded window yields no visible
  // weeks (all employees have "Not Submitted" timesheets for that range).
  // This prevents a "No Data" screen when data exists in older date ranges,
  // which happens frequently when skip_empty_weeks is active with a filter.
  useEffect(() => {
    if (isLoadingTeamApiData) return;
    if (pages.length === 0) return;
    if (hasMoreEmployees) return; // current window not fully loaded yet
    if (weekGroups.length > 0) return; // we have visible data
    if (!hasMoreWeeks) return;

    setWeekDate((prev) =>
      getFormatedDate(addDays(prev, -(NUMBER_OF_WEEKS_TO_FETCH * 7))),
    );
    setEmployeeStart(0);
  }, [
    isLoadingTeamApiData,
    hasMoreEmployees,
    hasMoreWeeks,
    weekGroups.length,
    pages.length,
  ]);

  // Unified loadMore: prioritizes employee pagination, then week pagination.
  const loadMore = useCallback(() => {
    if (isLoadingTeamApiData) return;

    // Priority 1: Load more employees for current date range
    if (hasMoreEmployees) {
      setEmployeeStart((prev) => prev + EMPLOYEE_PAGE_LENGTH);
      return;
    }

    // Priority 2: Load more weeks (with employee pagination reset).
    // Advance by the fixed batch window from the current weekDate so we always
    // produce a new date value.
    if (hasMoreWeeks) {
      setWeekDate((prev) =>
        getFormatedDate(addDays(prev, -(NUMBER_OF_WEEKS_TO_FETCH * 7))),
      );
      setEmployeeStart(0);
    }
  }, [hasMoreEmployees, hasMoreWeeks, isLoadingTeamApiData]);

  // Merge a realtime-pushed payload into the existing pages.
  // For each employee in the incoming payload, update their record in whichever
  // pages already contain them, replacing only the weeks that are present in
  // the update so that pages covering other date ranges are left untouched.
  const handleRealtimeUpdate = useCallback((payload: ApiPayload) => {
    if (!payload.data) return;
    setPages((prev) =>
      prev.map((page) => {
        if (!page.data) return page;
        let changed = false;
        const nextData = { ...page.data };
        for (const [empName, updatedEmp] of Object.entries(payload.data!)) {
          if (!nextData[empName]) continue;
          if (!updatedEmp.timesheet_details) continue;
          const mergedDetails = {
            ...nextData[empName].timesheet_details,
            ...updatedEmp.timesheet_details,
          };
          nextData[empName] = {
            ...nextData[empName],
            timesheet_details: mergedDetails,
          };
          changed = true;
        }
        return changed ? { ...page, data: nextData } : page;
      }),
    );
  }, []);

  return {
    hasMore,
    isLoadingTeamData: isLoadingTeamApiData,
    weekGroups,
    loadMore,
    handleRealtimeUpdate,
    error: teamDataError,
    resetData,
  };
}
