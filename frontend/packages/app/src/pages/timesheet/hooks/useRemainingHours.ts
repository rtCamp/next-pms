/**
 * External Dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal Dependencies.
 */
import { FALLBACK_DAILY_WORKING_HOURS } from "@/lib/constant";

type RemainingHoursResponse = {
  message: {
    working_hour: number;
    remaining_hours: number;
  };
};

interface UseRemainingHoursArgs {
  /** Employee the time entry is being logged for. */
  employee?: string;
  /** Date the time entry is being logged on. */
  date?: string;
  /** Only fetch remaining hours if this is true. */
  enabled: boolean;
}

/**
 * A hook to fetch the remaining hours for an employee on a given date.
 */
export const useRemainingHours = ({
  employee,
  date,
  enabled,
}: UseRemainingHoursArgs) => {
  const shouldFetch = enabled && Boolean(employee) && Boolean(date);

  const { data, isValidating } = useFrappeGetCall<RemainingHoursResponse>(
    "next_pms.timesheet.api.timesheet.get_remaining_hour_for_employee",
    { employee, date },
    shouldFetch ? undefined : null,
  );

  return {
    maxDuration: data?.message?.working_hour ?? FALLBACK_DAILY_WORKING_HOURS,
    hoursLeft: data?.message?.remaining_hours ?? FALLBACK_DAILY_WORKING_HOURS,
    isLoading: shouldFetch && isValidating,
  };
};
