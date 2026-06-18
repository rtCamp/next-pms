/**
 * Internal dependencies.
 */
import { LEADERSHIP_KPIS, LEADERSHIP_STATS } from "./constants";
import { ForecastBreakdownCard } from "./forecastBreakdownCard";
import { KpiCard } from "./kpiCard";
import { StatCard } from "./statCard";
import { UtilisedTimeCard } from "./utilisedTimeCard";

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
      <div className="grid gap-3 md:grid-cols-2">
        <UtilisedTimeCard />
        <ForecastBreakdownCard />
      </div>
    </section>
  );
}
