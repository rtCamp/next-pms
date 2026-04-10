/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { addDays } from "date-fns";
import type { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import type { DataProp } from "@/types/timesheet";
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
  hasMoreWeeks: boolean;
  isLoadingTeamData: boolean;
  weekGroups: WeekGroup[];
  loadData: () => void;
  error: FrappeError | undefined;
};

type UseTeamTimesheetOptions = {
  employeeId: string;
};

export function useTeamTimesheetData({
  employeeId,
}: UseTeamTimesheetOptions): UseTeamTimesheetDataResult {
  const [weekDate, setWeekDate] = useState(getTodayDate());

  // Each entry represents one paginated fetch.
  // All derived data (weeks, members, timesheets) is computed from this.
  const [pages, setPages] = useState<ApiPayload[]>([]);

  // TODO: Implement proper pagination once the API paginates by week instead of by employee. Until then, this is effectively a single fetch with a large payload, so we can keep it simple.

  const {
    data: teamData,
    error: teamDataError,
    isLoading: isLoadingTeamApiData,
  } = useFrappeGetCall("next_pms.timesheet.api.team.get_team_timesheet_data", {
    date: weekDate,
    reports_to: employeeId,
    max_week: String(NUMBER_OF_WEEKS_TO_FETCH),
    page_length: "100",
    start: "0",
  });

  useEffect(() => {
    if (!employeeId || !teamData?.message) {
      return;
    }
    setPages((prev) => [...prev, teamData.message as ApiPayload]);
  }, [teamData, employeeId]);

  // All transformation lives here. Because this is pure data derivation (no side effects).
  const { hasMoreWeeks, weekGroups } = useMemo(() => {
    // Default to true so the UI shows a loading/fetchable state before the first page lands.
    const hasMoreWeeks =
      pages.length > 0 ? (pages[pages.length - 1].has_more ?? false) : true;

    // Collapse all pages into a weeks map and a per-employee map.
    const weeksMap: Record<string, WeekEntry> = {};

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
      (payload.dates ?? []).forEach((week) => {
        weeksMap[week.start_date] = week;
      });

      Object.values(payload.data ?? {})
        .filter((emp) => emp.name)
        .forEach((emp) => {
          if (!employeeMap[emp.name]) {
            employeeMap[emp.name] = {
              member: {
                name: emp.name,
                employee_name: emp.employee_name,
                image: emp.image,
              },
              working_hour: emp.working_hour,
              working_frequency: emp.working_frequency,
              timesheetDetails: emp.timesheet_details ?? {},
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
                ...(emp.timesheet_details ?? {}),
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

    const weekMap = new Map<string, WeekGroup>(
      Object.values(weeksMap).map((week) => [
        week.start_date,
        {
          key: week.key,
          start_date: week.start_date,
          end_date: week.end_date,
          dates: week.dates,
          members: [],
          approvalPendingCount: 0,
        } as WeekGroup,
      ]),
    );

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
          if (week.status === "Not Submitted") {
            return;
          }
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
            employee: member,
            week,
            holidays,
            leaves,
            working_hour,
            working_frequency,
          });
        });
      },
    );

    const weekGroups = Array.from(weekMap.values()).sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );

    return { hasMoreWeeks, weekGroups };
  }, [pages]);

  const loadData = useCallback(() => {
    if (!hasMoreWeeks || isLoadingTeamApiData || weekGroups.length === 0)
      return;

    const oldestWeek = weekGroups[weekGroups.length - 1];
    setWeekDate(getFormatedDate(addDays(oldestWeek.start_date, -1)));
  }, [hasMoreWeeks, isLoadingTeamApiData, weekGroups]);

  return {
    hasMoreWeeks,
    isLoadingTeamData: isLoadingTeamApiData,
    weekGroups,
    loadData,
    error: teamDataError,
  };
}
