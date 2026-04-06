/**
 * Internal dependencies.
 */
import { ProjectTimesheetTable } from "./projectTimesheetTable";
import { ProjectTimesheetProvider } from "./provider";

function TimesheetProjectPage() {
  return (
    <ProjectTimesheetProvider>
      <ProjectTimesheetTable />
    </ProjectTimesheetProvider>
  );
}

export default TimesheetProjectPage;
