/**
 * Internal dependencies.
 */
import { TeamTimesheetProvider } from "./provider";
import { TeamTimesheetTable } from "./teamTimesheetTable";

function TeamTimesheet() {
  return (
    <TeamTimesheetProvider>
      <TeamTimesheetTable />
    </TeamTimesheetProvider>
  );
}

export default TeamTimesheet;
