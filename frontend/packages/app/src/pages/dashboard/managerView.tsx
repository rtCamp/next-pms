/**
 * Internal dependencies.
 */
import { AssignedProjectsCard } from "./assignedProjectsCard";
import { MANAGER_STATS } from "./constants";
import { StatCard } from "./statCard";

export function ManagerView() {
  return (
    <section aria-label="Manager dashboard" className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        {MANAGER_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <AssignedProjectsCard />
    </section>
  );
}
