/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat, formatPercentage } from "@/lib/utils";
import { ContractsTable } from "./components/contractsTable";
import { CostBurnCell } from "./components/costBurn";
import { HoursUsageCell } from "./components/hoursUsage";
import { InvoiceBurnCell } from "./components/invoiceBurn";
import { KnowledgePoint } from "./components/knowledgePoint";
import { ProjectRatesTable } from "./components/projectRatesTable";
import { TaskCompletionCell } from "./components/taskCompletion";
import { useTracking } from "./context";
import { TrackingProvider } from "./provider";
import { useProjectDetail } from "../../context";

export function Tracking() {
  return (
    <TrackingProvider>
      <TrackingContent />
    </TrackingProvider>
  );
}

function TrackingContent() {
  const projectId = useProjectDetail((s) => s.projectId);
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const tracking = useTracking((state) => state.tracking);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <KnowledgePoint title="Company" value={tracking.company} />
        <KnowledgePoint
          title="Total project value"
          value={currencyFormat(currency).format(
            tracking.total_project_value ?? 0,
          )}
          href={`${ROUTES.desk}/sales-order?status=${encodeURIComponent(
            JSON.stringify(["!=", "Cancelled"]),
          )}&project=${encodeURIComponent(projectId)}`}
        />
        <KnowledgePoint
          title="Projected profit"
          value={currencyFormat(currency).format(tracking.project_profit ?? 0)}
        />
        <KnowledgePoint
          title="Projected profit margin"
          value={formatPercentage(tracking.projected_profit_margin ?? 0)}
        />
      </div>

      <div className="flex gap-3">
        <HoursUsageCell />
        <TaskCompletionCell />
      </div>

      <div className="flex gap-3">
        <InvoiceBurnCell />
        <CostBurnCell />
      </div>
      <div className="flex gap-3">
        <KnowledgePoint
          title="Lifetime value to date"
          value={currencyFormat(currency).format(
            tracking.lifetime_values?.lifetime_value_to_date ?? 0,
          )}
        />
        <KnowledgePoint
          title="Expected lifetime value"
          value={currencyFormat(currency).format(
            tracking.lifetime_values?.expected_lifetime_value ?? 0,
          )}
        />
        <KnowledgePoint
          title="Lifetime value vs billed amount"
          value={currencyFormat(currency).format(
            tracking.lifetime_values?.lifetime_value_vs_billed_amount ?? 0,
          )}
        />
      </div>

      <ContractsTable />

      <ProjectRatesTable />
    </div>
  );
}
