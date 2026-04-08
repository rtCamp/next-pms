/**
 * Internal dependencies.
 */
import { ErrorFallback } from "@next-pms/design-system/components";
import { ProjectTimesheetTable } from "./projectTimesheetTable";
import { ProjectTimesheetProvider } from "./provider";

function TimesheetProjectPage() {
  return (
    <ErrorFallback>
      <ProjectTimesheetProvider>
        <ProjectTimesheetTable />
      </ProjectTimesheetProvider>
    </ErrorFallback>
  );
}

export default TimesheetProjectPage;
