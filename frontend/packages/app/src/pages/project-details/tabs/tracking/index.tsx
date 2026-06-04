/**
 * External dependencies.
 */
import { useParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ContractsTable } from "./components/contractsTable";
import { CostBurnCell } from "./components/costBurn";
import { HoursUsageCell } from "./components/hoursUsage";
import { InvoiceBurnCell } from "./components/invoiceBurn";
import { ProjectRatesTable } from "./components/projectRatesTable";
import { TaskCompletionCell } from "./components/taskCompletion";
import { getTrackingData } from "./fake-data";
import { KnowledgePoint } from "./knowledgePoint";
import { TrackingProvider } from "./provider";

export function Tracking() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const data = getTrackingData(projectId);

  return (
    <TrackingProvider projectId={projectId}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          <KnowledgePoint title="Company" value={data.company.value} />
          <KnowledgePoint
            title="Total project value"
            value={data.totalProjectValue.value}
          />
          <KnowledgePoint
            title="Project profit"
            value={data.projectProfit.value}
          />
          <KnowledgePoint
            title="Projected profit margin"
            value={data.projectedProfitMargin.value}
          />
        </div>

        <div className="flex gap-3">
          <HoursUsageCell />
          <TaskCompletionCell data={data.taskCompletion} />
        </div>

        <div className="flex gap-3">
          <InvoiceBurnCell data={data.invoicing} />
          <CostBurnCell />
        </div>
        <div className="flex gap-3">
          <KnowledgePoint
            title="Lifetime value to date"
            value={data.lifetimeValueToDate.value}
          />
          <KnowledgePoint
            title="Expected lifetime value"
            value={data.expectedLifetimeValue.value}
          />
          <KnowledgePoint
            title="Lifetime value vs billed amount"
            value={data.lifetimeValueVsBilledAmount.value}
          />
        </div>

        <ContractsTable
          rows={data.contracts}
          onEdit={() => {}}
          onDelete={() => {}}
        />

        <ProjectRatesTable
          rows={data.rates}
          flatRate={data.flatRate}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </TrackingProvider>
  );
}
