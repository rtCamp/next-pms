/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ReportConfiguration } from "./reportConfiguration";
import { ReportsTable } from "./reportsTable";
import { useProjectReport } from "./useProjectReport";
import { useProjectDetail } from "../../context";

export function Reports() {
  const { project, isLoading } = useProjectDetail((state) => state);
  const report = useProjectReport();

  if (isLoading || !project) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <ReportConfiguration report={report} />
      <ReportsTable reports={report.reports} />
    </div>
  );
}
