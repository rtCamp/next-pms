/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { AvailabilityByDate } from "./types";

interface UseEmployeeAvailabilityOptions {
  employeeId: string;
  startDate: string;
  endDate: string;
  includeWeekends: boolean;
  enabled: boolean;
}

interface EmployeeAvailabilityResponse {
  message?: {
    dates?: Record<
      string,
      {
        availability_factor: number;
        available_hours: number;
        is_holiday: boolean;
        holiday_name?: string;
      }
    >;
  };
}

/**
 * The days in a range the employee is not fully available, keyed by date. Days not in the
 * map are full working days.
 */
export function useEmployeeAvailability({
  employeeId,
  startDate,
  endDate,
  includeWeekends,
  enabled,
}: UseEmployeeAvailabilityOptions): AvailabilityByDate {
  const { data } = useFrappeGetCall<EmployeeAvailabilityResponse>(
    "next_pms.resource_management.api.allocation.get_employee_availability",
    {
      employee: employeeId,
      start_date: startDate,
      end_date: endDate,
      include_weekends: includeWeekends ? 1 : 0,
    },
    enabled && employeeId && startDate && endDate ? undefined : false,
  );

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(data?.message?.dates ?? {}).map(([date, day]) => [
          date,
          {
            availabilityFactor: day.availability_factor,
            isHoliday: day.is_holiday,
            ...(day.holiday_name ? { holidayName: day.holiday_name } : {}),
          },
        ]),
      ),
    [data],
  );
}
