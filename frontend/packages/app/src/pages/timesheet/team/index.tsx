/**
 * Internal dependencies.
 */
import { ErrorFallback } from "@next-pms/design-system/components";
import { TeamTimesheetProvider } from "./provider";
import { TeamTimesheetTable } from "./teamTimesheetTable";

function TeamTimesheet() {
  return (
    <ErrorFallback>
      <TeamTimesheetProvider>
        <TeamTimesheetTable />
      </TeamTimesheetProvider>
    </ErrorFallback>
  );
}

export default TeamTimesheet;
