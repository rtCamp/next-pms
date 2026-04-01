/**
 * Internal dependencies.
 */
import { PersonalTimesheetTable } from "./personalTimesheetTable";
import { PersonalTimesheetProvider } from "./provider";

function PersonalTimesheet() {
  return (
    <PersonalTimesheetProvider>
      <PersonalTimesheetTable />
    </PersonalTimesheetProvider>
  );
}

export default PersonalTimesheet;
