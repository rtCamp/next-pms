/**
 * Internal dependencies.
 */
import { ErrorFallback } from "@next-pms/design-system/components";
import { AllocationsTeamTable } from "@/pages/allocations/team/allocationsTeamTable";
import { AllocationsTeamProvider } from "@/pages/allocations/team/provider";

function AllocationsTeamLayout() {
  return (
    <ErrorFallback>
      <AllocationsTeamProvider>
        <AllocationsTeamTable />
      </AllocationsTeamProvider>
    </ErrorFallback>
  );
}

export default AllocationsTeamLayout;
