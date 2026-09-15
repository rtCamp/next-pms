/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat, mergeClassNames as cn } from "@/lib/utils";
import { FinancialsBlock } from "./financialsBlock";
import { KnowledgePoint } from "./knowledgePoint";
import { useProjectDetail } from "../../../context";
import { useTracking } from "../context";
import type { WidgetLayout } from "../types";

export function FinancialsColumn({ layout }: { layout: WidgetLayout }) {
  const projectId = useProjectDetail((s) => s.projectId);
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const billingType = useTracking((s) => s.tracking.billing_type);
  const totalProjectValue = useTracking((s) => s.tracking.total_project_value);

  if (billingType === "Time and Material") {
    return <FinancialsBlock showProjectValue layout={layout} />;
  }

  const salesOrderHref = `${ROUTES.desk}/sales-order?status=${encodeURIComponent(
    JSON.stringify(["!=", "Cancelled"]),
  )}&project=${encodeURIComponent(projectId)}`;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col justify-between gap-3",
        layout === "row" && "lg:flex-row",
      )}
    >
      <div className={cn("flex shrink-0", layout === "row" && "lg:flex-1")}>
        <KnowledgePoint
          title="Total project value"
          value={currencyFormat(currency).format(totalProjectValue ?? 0)}
          href={salesOrderHref}
        />
      </div>
      <div className={cn("flex flex-1", layout === "row" && "lg:flex-2")}>
        <FinancialsBlock showProjectValue={false} layout={layout} />
      </div>
    </div>
  );
}
