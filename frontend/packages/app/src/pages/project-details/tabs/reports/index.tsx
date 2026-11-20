/**
 * Internal dependencies.
 */
import { useCapability } from "@/hooks/useCapability";
import { ReportGenerationForm } from "./reportGenerationForm";
import { ReportsTable } from "./reportsTable";
import { useProjectDetail } from "../../context";

export function Reports() {
  const reports = useProjectDetail(
    (state) => state.project?.custom_project_reports ?? [],
  );
  const canGenerateReports = useCapability("project_admin");

  return (
    <div className="flex flex-col gap-6 p-4">
      {canGenerateReports && <ReportGenerationForm />}
      <ReportsTable reports={reports} />
    </div>
  );
}
