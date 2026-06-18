/**
 * Internal dependencies.
 */
import { LEADERSHIP_KPIS, LEADERSHIP_STATS } from "../constants";
import { ForecastBreakdownCard } from "./widget/forecastBreakdownCard";
import { HeatmapCard } from "./widget/heatmapCard";
import { KpiCard } from "./widget/kpiCard";
import { NotificationsCard } from "./widget/notificationsCard";
import { UtilisedTimeCard } from "./widget/utilisedTimeCard";
import { StatCard } from "../widget/statCard";

export function LeadershipView() {
  return (
    <section aria-label="Leadership dashboard" className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {LEADERSHIP_KPIS.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {LEADERSHIP_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
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
  );
}
