/**
 * External dependencies.
 */
import { useMemo } from "react";
import {
  addDays,
  differenceInCalendarWeeks,
  eachDayOfInterval,
  format,
  isWeekend,
  parseISO,
} from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { expectatedHours } from "@/lib/utils";
import type { TeamAllocationResponse } from "../type";
import { FALLBACK_DAILY_WORKING_HOURS } from "./constants";
import { OverAllocatedDay } from "./overAllocationWarning";

interface UseOverAllocationOptions {
  employeeId: string;
  fromDate: string;
  toDate: string;
  hoursPerDay: number;
  includeWeekends: boolean;
  /**
   * Number of additional weekly copies that will be created on save.
   * Pass 0 for one-time or edit.
   */
  repeatWeeks: number;
  /** Name of the allocation being edited — excluded from the existing-hours sum. */
  allocationName?: string;
}

interface ExistingAllocation {
  name: string;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated_per_day: number;
  override?: {
    date: string;
    hours?: number | null;
    cancelled?: number | null;
  }[];
}

interface EmployeeWorkingHoursResponse {
  message?: {
    working_hour?: number;
    working_frequency?: string;
  };
}

export function useOverAllocation({
  employeeId,
  fromDate,
  toDate,
  hoursPerDay,
  includeWeekends,
  repeatWeeks,
  allocationName,
}: UseOverAllocationOptions): OverAllocatedDay[] {
  const debouncedHoursPerDay = useDebounce(hoursPerDay, 500);
  const debouncedFromDate = useDebounce(fromDate, 500);
  const debouncedToDate = useDebounce(toDate, 500);
  const debouncedRepeatWeeks = useDebounce(repeatWeeks, 500);

  const enabled =
    Boolean(employeeId) &&
    Boolean(debouncedFromDate) &&
    Boolean(debouncedToDate) &&
    debouncedFromDate <= debouncedToDate &&
    debouncedHoursPerDay > 0;

  // Extend the fetch range to cover all recurring copies.
  const fetchEndDate = useMemo(() => {
    if (!debouncedToDate || debouncedRepeatWeeks <= 0) return debouncedToDate;
    return format(
      addDays(parseISO(debouncedToDate), debouncedRepeatWeeks * 7),
      "yyyy-MM-dd",
    );
  }, [debouncedToDate, debouncedRepeatWeeks]);
  const maxWeek = useMemo(() => {
    if (!enabled) {
      return 1;
    }

    return (
      differenceInCalendarWeeks(
        parseISO(fetchEndDate),
        parseISO(debouncedFromDate),
        {
          weekStartsOn: 1,
        },
      ) + 1
    );
  }, [debouncedFromDate, enabled, fetchEndDate]);

  const { data } = useFrappeGetCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
    {
      date: debouncedFromDate,
      max_week: maxWeek,
      employee_id: JSON.stringify([employeeId]),
      page_length: 1,
      start: 0,
      need_hours_summary: false,
    },
    enabled ? undefined : false,
  );

  const fetchedAllocations = useMemo(
    () =>
      (data?.message as TeamAllocationResponse | undefined)
        ?.resource_allocations as ExistingAllocation[] | undefined,
    [data],
  );
  const relevantAllocations = useMemo(
    () =>
      (fetchedAllocations ?? []).filter(
        (allocation) => allocation.name !== allocationName,
      ),
    [allocationName, fetchedAllocations],
  );

  const { data: workingHoursData } =
    useFrappeGetCall<EmployeeWorkingHoursResponse>(
      "next_pms.timesheet.api.employee.get_employee_working_hours",
      {
        employee: employeeId,
      },
      employeeId ? undefined : false,
    );

  const dailyWorkingHours = useMemo(() => {
    const workingHour = workingHoursData?.message?.working_hour;
    const resolvedWorkingHour =
      workingHour && workingHour > 0
        ? workingHour
        : FALLBACK_DAILY_WORKING_HOURS;

    const workingFrequency =
      workingHoursData?.message?.working_frequency === "Per Week"
        ? "Per Week"
        : "Per Day";

    return Number(
      expectatedHours(resolvedWorkingHour, workingFrequency).toFixed(2),
    );
  }, [workingHoursData]);

  return useMemo(() => {
    if (!enabled) return [];

    const existingHoursForDate = (dateStr: string) =>
      relevantAllocations.reduce((sum, allocation) => {
        if (
          allocation.allocation_start_date > dateStr ||
          allocation.allocation_end_date < dateStr
        ) {
          return sum;
        }

        const override = allocation.override?.find(
          (overrideEntry) => overrideEntry.date === dateStr,
        );
        const effectiveHours =
          override?.cancelled === 1
            ? 0
            : (override?.hours ?? allocation.hours_allocated_per_day ?? 0);

        return sum + effectiveHours;
      }, 0);

    const result: OverAllocatedDay[] = [];
    const baseStart = parseISO(debouncedFromDate);
    const baseEnd = parseISO(debouncedToDate);

    // Iterate each weekly copy (week 0 = base range, week 1..N = recurring copies).
    for (let week = 0; week <= debouncedRepeatWeeks; week++) {
      const weekStart = addDays(baseStart, week * 7);
      const weekEnd = addDays(baseEnd, week * 7);

      for (const d of eachDayOfInterval({ start: weekStart, end: weekEnd })) {
        if (!includeWeekends && isWeekend(d)) {
          continue;
        }

        const dateStr = format(d, "yyyy-MM-dd");
        const existingHours = existingHoursForDate(dateStr);

        const total = existingHours + debouncedHoursPerDay;
        if (total > dailyWorkingHours) {
          result.push({
            date: dateStr,
            excessHours: Math.round((total - dailyWorkingHours) * 100) / 100,
          });
        }
      }
    }

    return result;
  }, [
    enabled,
    relevantAllocations,
    debouncedFromDate,
    debouncedToDate,
    debouncedRepeatWeeks,
    debouncedHoursPerDay,
    dailyWorkingHours,
    includeWeekends,
  ]);
}
