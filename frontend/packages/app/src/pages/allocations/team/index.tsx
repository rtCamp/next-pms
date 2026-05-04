/**
 * Internal dependencies.
 */
import { ErrorFallback } from "@next-pms/design-system/components";
import { AllocationsTeamTable } from "@/pages/allocations/team/allocationsTeamTable";

function AllocationsTeamLayout() {
  return (
    <ErrorFallback>
      <AllocationsTeamTable />
    </ErrorFallback>
  );
}

export default AllocationsTeamLayout;
