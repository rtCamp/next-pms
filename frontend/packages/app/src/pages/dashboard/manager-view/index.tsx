/**
 * Internal dependencies.
 */
import { MANAGER_STATS } from "../constants";
import { StatCard } from "../widget/statCard";

export function ManagerView() {
  return (
    <section aria-label="Manager dashboard" className="grid grid-cols-4 gap-3">
      {MANAGER_STATS.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}
