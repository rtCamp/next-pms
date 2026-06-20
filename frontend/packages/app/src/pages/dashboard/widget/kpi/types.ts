/**
 * Internal dependencies.
 */
import type { KpiCardData } from "../kpiCard";

export type LeadershipMetricKey = "revenue" | "cost" | "profit_margin";

export interface LeadershipKpiConfig {
  metricKey: LeadershipMetricKey;
  label: string;
  formatValue: (value: number) => string;
  /** Tone when the metric trends up; the down case uses the opposite tone. */
  upTone: KpiCardData["trend"]["tone"];
}
