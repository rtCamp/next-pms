/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { ContractsTable } from "./components/contractsTable";
import { CostBurnCell } from "./components/costBurn";
import { HoursUsageCell } from "./components/hoursUsage";
import { InvoiceBurnCell } from "./components/invoiceBurn";
import { ProjectRatesTable } from "./components/projectRatesTable";
import { TaskCompletionCell } from "./components/taskCompletion";
import { useTracking } from "./context";
import { KnowledgePoint } from "./knowledgePoint";
import { TrackingProvider } from "./provider";

export function Tracking() {
  return (
    <TrackingProvider>
      <TrackingContent />
    </TrackingProvider>
  );
}

function TrackingContent() {
  const tracking = useTracking((state) => state.tracking);
  const formatter = currencyFormat(tracking.currency);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <KnowledgePoint title="Company" value={tracking.company} />
        <KnowledgePoint
          title="Total project value"
          value={formatter.format(tracking.total_project_value)}
        />
        <KnowledgePoint
          title="Project profit"
          value={formatter.format(tracking.project_profit)}
        />
        <KnowledgePoint
          title="Projected profit margin"
          value={`${tracking.projected_profit_margin.toFixed(2)}%`}
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
          value={formatter.format(tracking.lifetime_value_to_date || 0)}
        />
        <KnowledgePoint
          title="Expected lifetime value"
          value={formatter.format(tracking.expected_lifetime_value || 0)}
        />
        <KnowledgePoint
          title="Lifetime value vs billed amount"
          value={formatter.format(
            tracking.lifetime_value_vs_billed_amount || 0,
          )}
        />
      </div>

      <ContractsTable />

      <ProjectRatesTable />
    </div>
  );
}
