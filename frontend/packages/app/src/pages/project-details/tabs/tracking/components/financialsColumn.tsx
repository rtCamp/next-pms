/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat } from "@/lib/utils";
import { FinancialsBlock } from "./financialsBlock";
import { KnowledgePoint } from "./knowledgePoint";
import { useProjectDetail } from "../../../context";
import { useTracking } from "../context";

export function FinancialsColumn() {
  const projectId = useProjectDetail((s) => s.projectId);
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const billingType = useTracking((s) => s.tracking.billing_type);
  const totalProjectValue = useTracking((s) => s.tracking.total_project_value);

  if (billingType === "Time and Material") {
    return <FinancialsBlock showProjectValue />;
  }

  const salesOrderHref = `${ROUTES.desk}/sales-order?status=${encodeURIComponent(
    JSON.stringify(["!=", "Cancelled"]),
  )}&project=${encodeURIComponent(projectId)}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
      <div className="flex shrink-0">
        <KnowledgePoint
          title="Total project value"
          value={currencyFormat(currency).format(totalProjectValue ?? 0)}
          href={salesOrderHref}
        />
      </div>
      <FinancialsBlock showProjectValue={false} />
    </div>
  );
}
