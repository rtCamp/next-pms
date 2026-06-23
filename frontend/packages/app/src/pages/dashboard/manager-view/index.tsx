/**
 * Internal dependencies.
 */

import StatCards from "../widget/stat-cards";

export function ManagerView() {
  return (
    <section aria-label="Manager dashboard" className="grid grid-cols-4 gap-3">
      <StatCards />
    </section>
  );
}
