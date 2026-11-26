import { dayjs } from "frappe-ui";

export type KpiKey = "revenue" | "cost" | "profit_margin";

export interface KpiMetric {
  current: number;
}

export type LeadershipKpis = Record<KpiKey, KpiMetric>;

export const KPI_LABELS: Record<KpiKey, string> = {
  revenue: "Revenue",
  cost: "Cost",
  profit_margin: "Profit margin",
};

/** The format `MonthPicker` reads and writes, e.g. `"May 2026"`. */
const MONTH_FORMAT = "MMMM YYYY";
const API_DATE_FORMAT = "YYYY-MM-DD";

/** Last month, the KPI cards' month until the user picks one. */
export function defaultKpiMonth(): string {
  return dayjs().subtract(1, "month").format(MONTH_FORMAT);
}

/** `get_leadership_kpis` params: the picked month and the one before it. */
export function kpiParams(month: string): Record<string, string> {
  const current = dayjs(month, MONTH_FORMAT);
  const previous = current.subtract(1, "month");
  return {
    cur_start: current.startOf("month").format(API_DATE_FORMAT),
    cur_end: current.endOf("month").format(API_DATE_FORMAT),
    prev_start: previous.startOf("month").format(API_DATE_FORMAT),
    prev_end: previous.endOf("month").format(API_DATE_FORMAT),
  };
}
