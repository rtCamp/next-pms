/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { LeadershipKPIResponse } from "../../leadership-view/provider/type";
import type { KpiCardData } from "../kpiCard";
import type { LeadershipKpiConfig } from "./types";

// MonthPicker emits and consumes this format, e.g. "May 2026".
const MONTH_VALUE_FORMAT = "MMMM yyyy";
const API_DATE_FORMAT = "yyyy-MM-dd";

const getDefaultMonth = () =>
  format(startOfMonth(subMonths(new Date(), 1)), MONTH_VALUE_FORMAT);

const formatChange = (changePct: number | null) =>
  changePct === null ? "—" : `${changePct >= 0 ? "+" : ""}${changePct}%`;

export function useLeadershipKpi(config: LeadershipKpiConfig) {
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

  const cardData = useMemo<KpiCardData | null>(() => {
    const metric = data?.message?.[config.metricKey];
    if (!metric) return null;
    const oppositeTone = config.upTone === "positive" ? "negative" : "positive";
    return {
      label: config.label,
      value: config.formatValue(metric.current),
      trend: {
        value: formatChange(metric.change_pct),
        direction: metric.trend,
        tone: metric.trend === "up" ? config.upTone : oppositeTone,
      },
    };
  }, [data, config]);

  return { month, setMonth, cardData, isLoading, error };
}
