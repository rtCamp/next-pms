/**
 * Internal dependencies.
 */
import { LEADERSHIP_STATS } from "./constants";
import { StatCard } from "./statCard";
import { UtilisedTimeCard } from "./utilisedTimeCard";

export function LeadershipView() {
  return (
    <section aria-label="Leadership dashboard" className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        {LEADERSHIP_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <UtilisedTimeCard />
    </section>
  );
}
