/**
 * External dependencies.
 */
import { useParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { CostBurnCard } from "./costBurnCard";
import { getTrackingData } from "./fake-data";
import { HoursUsageCard } from "./hoursUsageCard";
import { InvoiceBurnCard } from "./invoiceBurnCard";
import { KnowledgePoint } from "./knowledgePoint";
import { TaskCompletionCard } from "./taskCompletionCard";

export function Tracking() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const data = getTrackingData(projectId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <HoursUsageCard data={data.hoursUsage} />
        <TaskCompletionCard data={data.taskCompletion} />
        <CostBurnCard data={data.costBurn} />
        <InvoiceBurnCard data={data.invoiceBurn} />
      </div>
      <div className="flex gap-3">
        <KnowledgePoint title="Company" value={data.company} />
        <KnowledgePoint
          title="Total project value"
          value={data.totalProjectValue}
        />
        <KnowledgePoint title="Project profit" value={data.projectProfit} />
        <KnowledgePoint
          title="Projected profit margin"
          value={data.projectedProfitMargin}
        />
      </div>
      <div className="flex gap-3">
        <KnowledgePoint
          title="Lifetime value to date"
          value={data.lifetimeValueToDate}
        />
        <KnowledgePoint
          title="Expected lifetime value"
          value={data.expectedLifetimeValue}
        />
        <KnowledgePoint
          title="Lifetime value vs billed amount"
          value={data.lifetimeValueVsBilledAmount}
        />
      </div>
    </div>
  );
}
