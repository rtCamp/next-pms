/**
 * Internal dependencies.
 */
import { ReportGenerationForm } from "./reportGenerationForm";
import { ReportsTable } from "./reportsTable";
import { useProjectDetail } from "../../context";

export function Reports() {
  const reports = useProjectDetail(
    (state) => state.project?.custom_project_reports ?? [],
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <ReportGenerationForm />
      <ReportsTable reports={reports} />
    </div>
  );
}
