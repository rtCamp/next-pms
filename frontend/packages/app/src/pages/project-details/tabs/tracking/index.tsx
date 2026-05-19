/**
 * External dependencies.
 */
import { useParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { getTrackingData } from "./fake-data";
import { KnowledgePoint } from "./knowledgePoint";

export function Tracking() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const data = getTrackingData(projectId);

  return (
    <div className="flex flex-col gap-3">
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
