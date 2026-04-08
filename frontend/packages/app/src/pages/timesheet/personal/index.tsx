/**
 * Internal dependencies.
 */
import { ErrorFallback } from "@next-pms/design-system/components";
import { PersonalTimesheetTable } from "./personalTimesheetTable";
import { PersonalTimesheetProvider } from "./provider";

function PersonalTimesheet() {
  return (
    <ErrorFallback>
      <PersonalTimesheetProvider>
        <PersonalTimesheetTable />
      </PersonalTimesheetProvider>
    </ErrorFallback>
  );
}

export default PersonalTimesheet;
