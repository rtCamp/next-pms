/**
 * External dependencies.
 */
import { useMemo } from "react";
import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { LeadershipKPIResponse } from "./types";

// MonthPicker emits and consumes this format, e.g. "May 2026".
export const MONTH_VALUE_FORMAT = "MMMM yyyy";
const API_DATE_FORMAT = "yyyy-MM-dd";

export const getDefaultKpiMonth = () =>
  format(startOfMonth(subMonths(new Date(), 1)), MONTH_VALUE_FORMAT);

export function useLeadershipKpi(
  key: keyof LeadershipKPIResponse["message"],
  month: string,
) {
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

  return { data: data?.message[key], isLoading, error };
}
