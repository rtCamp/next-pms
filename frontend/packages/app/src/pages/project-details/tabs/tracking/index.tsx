/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat, mergeClassNames as cn } from "@/lib/utils";
import { BudgetBurnCell } from "./components/budgetBurn";
import { ContractsTable } from "./components/contractsTable";
import { CostBurnCell } from "./components/costBurn";
import { FinancialsBlock } from "./components/financialsBlock";
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

  const salesOrderHref = `${ROUTES.desk}/sales-order?status=${encodeURIComponent(
    JSON.stringify(["!=", "Cancelled"]),
  )}&project=${encodeURIComponent(projectId)}`;

  const isBillable = tracking.billing_type !== "Non-Billable";

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          "flex flex-col gap-3 lg:flex-row",
          isBillable && "lg:*:basis-1/2!",
        )}
      >
        {isBillable && (
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            {tracking.billing_type === "Time and Material" ? (
              <FinancialsBlock showProjectValue />
            ) : (
              <>
                <div className="flex shrink-0">
                  <KnowledgePoint
                    title="Total project value"
                    value={currencyFormat(currency).format(
                      tracking.total_project_value ?? 0,
                    )}
                    href={salesOrderHref}
                  />
                </div>
                <FinancialsBlock showProjectValue={false} />
              </>
            )}
          </div>
        )}
        <TaskCompletionCell layout={isBillable ? "stacked" : "row"} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <HoursUsageCell />
        <InvoiceBurnCell />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <BudgetBurnCell />
        <CostBurnCell />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
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
