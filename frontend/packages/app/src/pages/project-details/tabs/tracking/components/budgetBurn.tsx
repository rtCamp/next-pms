/**
 * External dependencies.
 */
import { ProgressBar } from "@next-pms/design-system/components";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { useTracking } from "../context";
import { LegendItem } from "./legendItem";

export function BudgetBurnCell() {
  const projectId = useProjectDetail((state) => state.projectId);
  const currency = useProjectDetail((state) => state.project?.custom_currency);
  const budgetBurn = useTracking((state) => state.tracking.budget_burn);

  if (!budgetBurn) {
    return null;
  }

  const { actual, forecasted, total_budget: totalBudget } = budgetBurn;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base text-ink-gray-8 font-medium">
          Budget burn (to date)
        </span>
        <a
          href={`/desk/timesheet?parent_project=${projectId}`}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-base text-ink-gray-6 hover:text-ink-gray-8"
        >
          All Timesheets
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
      <ProgressBar
        value={actual}
        secondaryValue={actual + forecasted}
        maxValue={totalBudget}
        indicatorClassName="bg-surface-green-5"
        secondaryIndicatorClassName="bg-surface-green-3"
      />
      <div className="flex flex-col gap-2 text-base text-ink-gray-7">
        <LegendItem
          className="bg-surface-green-5"
          label="Actual budget burn"
          value={currencyFormat(currency).format(actual)}
          labelClassName="text-ink-gray-6"
          valueClassName="shrink-0 font-medium"
        />
        <LegendItem
          className="bg-surface-green-3"
          label="Forecasted budget burn"
          value={currencyFormat(currency).format(forecasted)}
          labelClassName="text-ink-gray-6"
          valueClassName="shrink-0 font-medium"
        />
        <LegendItem
          className="bg-surface-gray-3"
          label="Total project budget"
          value={currencyFormat(currency).format(totalBudget)}
          labelClassName="text-ink-gray-6"
          valueClassName="shrink-0 font-medium"
        />
      </div>
    </div>
  );
}
