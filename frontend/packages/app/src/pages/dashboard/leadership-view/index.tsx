/**
 * Internal dependencies.
 */
import { LeadershipViewProvider } from "./provider";
import { ForecastBreakdownCard } from "../widget/forecastBreakdownCard";
import { HeatmapCard } from "../widget/heatmapCard";
import { formatPercent, formatUsd } from "../widget/kpi/constants";
import { LeadershipKpiCard } from "../widget/kpi/leadershipKpiCard";
import type { LeadershipKpiConfig } from "../widget/kpi/types";
import { NotificationsCard } from "../widget/notificationsCard";
import { LiveStatCard } from "../widget/stat/liveStatCard";
import type { StatCardConfig } from "../widget/stat/types";
import { UtilisedTimeCard } from "../widget/utilization";

const KPI_CONFIGS: LeadershipKpiConfig[] = [
  {
    metricKey: "revenue",
    label: "Revenue",
    formatValue: formatUsd,
    upTone: "positive",
  },
  {
    metricKey: "cost",
    label: "Cost",
    formatValue: formatUsd,
    upTone: "negative",
  },
  {
    metricKey: "profit_margin",
    label: "Profit margin",
    formatValue: formatPercent,
    upTone: "positive",
  },
];

const STAT_CONFIGS: StatCardConfig[] = [
  {
    endpoint: "next_pms.api.dashboard.get_active_projects_count",
    label: "Active Projects",
    format: (message) => String(message),
  },
  {
    endpoint: "next_pms.api.dashboard.get_at_risk_projects_count",
    label: "At risk projects",
    format: (message) => String(message),
  },
  {
    endpoint: "next_pms.api.dashboard.get_members_without_allocation",
    label: "Members without allocation",
    subLabel: "this month",
    params: { days: 30 },
    format: (message) =>
      String(typeof message === "number" ? message : message.count),
  },
  {
    endpoint: "next_pms.api.dashboard.get_non_billable_hours",
    label: "Non-billable hours logged",
    subLabel: "this month",
    params: { days: 30 },
    format: (message) =>
      `${Math.round(typeof message === "number" ? message : 0)}h`,
  },
];

export function LeadershipView() {
  return (
    <LeadershipViewProvider>
      <section
        aria-label="Leadership dashboard"
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-3 gap-3">
          {KPI_CONFIGS.map((config) => (
            <LeadershipKpiCard key={config.metricKey} config={config} />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {STAT_CONFIGS.map((config) => (
            <LiveStatCard key={config.endpoint} config={config} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <HeatmapCard />
          </div>
          <NotificationsCard />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <UtilisedTimeCard />
          <ForecastBreakdownCard />
        </div>
      </section>
    </LeadershipViewProvider>
  );
}
