/**
 * External dependencies.
 */
import { useMemo } from "react";
import {
  addDays,
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
import { OverAllocatedDay } from "./overAllocationWarning";

const STANDARD_WORKING_HOURS = 8;

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

  const { data } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Resource Allocation",
      fields: [
        "name",
        "allocation_start_date",
        "allocation_end_date",
        "hours_allocated_per_day",
      ],
      filters: JSON.stringify([
        ["employee", "=", employeeId],
        ["allocation_start_date", "<=", fetchEndDate],
        ["allocation_end_date", ">=", debouncedFromDate],
      ]),
      limit_page_length: "null",
    },
    enabled ? undefined : false,
  );

  return useMemo(() => {
    if (!enabled || !data?.message) return [];

    const existing = (data.message as ExistingAllocation[]).filter(
      (a) => a.name !== allocationName,
    );

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
        const existingHours = existing
          .filter(
            (a) =>
              a.allocation_start_date <= dateStr &&
              a.allocation_end_date >= dateStr,
          )
          .reduce((sum, a) => sum + (a.hours_allocated_per_day ?? 0), 0);

        const total = existingHours + debouncedHoursPerDay;
        if (total > STANDARD_WORKING_HOURS) {
          result.push({
            date: dateStr,
            excessHours:
              Math.round((total - STANDARD_WORKING_HOURS) * 100) / 100,
          });
        }
      }
    }

    return result;
  }, [
    enabled,
    data,
    allocationName,
    debouncedFromDate,
    debouncedToDate,
    debouncedRepeatWeeks,
    debouncedHoursPerDay,
    includeWeekends,
  ]);
}
