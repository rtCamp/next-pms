/**
 * External dependencies.
 */
import { useMemo } from "react";
import { eachDayOfInterval, format, isWeekend, parseISO } from "date-fns";
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
  /** Name of the allocation being edited - excluded from the existing-hours sum. */
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
  allocationName,
}: UseOverAllocationOptions): OverAllocatedDay[] {
  const debouncedHoursPerDay = useDebounce(hoursPerDay, 500);
  const debouncedFromDate = useDebounce(fromDate, 500);
  const debouncedToDate = useDebounce(toDate, 500);

  const enabled =
    Boolean(employeeId) &&
    Boolean(debouncedFromDate) &&
    Boolean(debouncedToDate) &&
    debouncedFromDate <= debouncedToDate &&
    debouncedHoursPerDay > 0;

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
        ["allocation_start_date", "<=", debouncedToDate],
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
    const days = eachDayOfInterval({
      start: parseISO(debouncedFromDate),
      end: parseISO(debouncedToDate),
    });

    for (const d of days) {
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
          excess_hours:
            Math.round((total - STANDARD_WORKING_HOURS) * 100) / 100,
        });
      }
    }

    return result;
  }, [
    enabled,
    data,
    allocationName,
    debouncedFromDate,
    debouncedToDate,
    debouncedHoursPerDay,
    includeWeekends,
  ]);
}
