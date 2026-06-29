/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
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

interface OverAllocatedDatesResponse {
  message?: {
    dates?: { date: string; excess_hours: number }[];
    total_excess_hours?: number;
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

  const { data } = useFrappeGetCall<OverAllocatedDatesResponse>(
    "next_pms.resource_management.api.allocation.get_over_allocated_dates",
    {
      employee: employeeId,
      start_date: debouncedFromDate,
      end_date: debouncedToDate,
      hours_per_day: debouncedHoursPerDay,
      include_weekends: includeWeekends,
      repeat_till_week_count: debouncedRepeatWeeks,
      ...(allocationName ? { allocation_name: allocationName } : {}),
    },
    enabled ? undefined : false,
  );

  return useMemo(
    () =>
      (data?.message?.dates ?? []).map((entry) => ({
        date: entry.date,
        excessHours: entry.excess_hours,
      })),
    [data],
  );
}
