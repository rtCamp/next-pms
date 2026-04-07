/**
 * External Dependencies
 */
import { getFormatedDate } from "@next-pms/design-system";
import { addDays } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import type { CalendarEvent } from "./type";

interface UseCalendarEventsProps {
  initialDate: string;
  endDate?: string;
  enabled: boolean;
}

interface UseCalendarEventsResult {
  events: CalendarEvent[];
  isLoading: boolean;
  error: unknown;
}

const useCalendarEvents = ({
  initialDate,
  endDate,
  enabled,
}: UseCalendarEventsProps): UseCalendarEventsResult => {
  const {
    data: eventData,
    isLoading,
    error,
  } = useFrappeGetCall(
    "next_pms.api.get_user_calendar_events",
    {
      start_date: initialDate,
      end_date: endDate || getFormatedDate(addDays(initialDate, 7)),
    },
    enabled ? undefined : null,
    {
      errorRetryCount: 0,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  const events = ((eventData?.message || []) as CalendarEvent[]).filter(
    (event) => !event.all_day,
  );

  return {
    events,
    isLoading,
    error,
  };
};

export default useCalendarEvents;
