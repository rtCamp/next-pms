/**
 * Internal dependencies.
 */
import { LEADERSHIP_STATS } from "./constants";
import { StatCard } from "./statCard";

export function LeadershipView() {
  return (
    <section aria-label="Leadership dashboard" className="grid grid-cols-4 gap-3">
      {LEADERSHIP_STATS.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}
