/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { LeadershipKPIResponse } from "../../types";

// MonthPicker emits and consumes this format, e.g. "May 2026".
const MONTH_VALUE_FORMAT = "MMMM yyyy";
const API_DATE_FORMAT = "yyyy-MM-dd";

const getDefaultMonth = () =>
  format(startOfMonth(subMonths(new Date(), 1)), MONTH_VALUE_FORMAT);

export function useLeadershipKpi(key: keyof LeadershipKPIResponse["message"]) {
  const [month, setMonth] = useState(getDefaultMonth);

  const args = useMemo(() => {
    const monthDate = parse(month, MONTH_VALUE_FORMAT, new Date());
    const prevMonthDate = subMonths(monthDate, 1);
    return {
      cur_start: format(startOfMonth(monthDate), API_DATE_FORMAT),
      cur_end: format(endOfMonth(monthDate), API_DATE_FORMAT),
      prev_start: format(startOfMonth(prevMonthDate), API_DATE_FORMAT),
      prev_end: format(endOfMonth(prevMonthDate), API_DATE_FORMAT),
    };
  }, [month]);

  const { data, isLoading, error } = useFrappeGetCall<LeadershipKPIResponse>(
    "next_pms.api.dashboard.get_leadership_kpis",
    args,
  );

  return { month, setMonth, data: data?.message[key], isLoading, error };
}
