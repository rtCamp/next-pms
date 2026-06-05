import { ProgressBar } from "@next-pms/design-system/components";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { currencyFormat } from "@/lib/utils";
import { useTracking } from "../context";

export function CostBurnCell() {
  const tracking = useTracking((state) => state.tracking);
  const formatter = currencyFormat(tracking.currency);
  const incurred = tracking.actual_cost_incurred;
  const forecasted = tracking.forecasted_cost_to_completion;
  const total = tracking.expected_total_cost;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base text-ink-gray-8 font-medium">
          Cost Burn (to date)
        </span>
        <a
          href="/desk/timesheet"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-base text-ink-gray-6 hover:text-ink-gray-8"
        >
          All Timesheets
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
      <ProgressBar
        value={incurred}
        secondaryValue={incurred + forecasted}
        maxValue={total}
        indicatorClassName="bg-surface-green-5"
        secondaryIndicatorClassName="bg-surface-green-3"
      />
      <div className="flex flex-col gap-2 text-base text-ink-gray-7">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-green-5" />
          <span className="min-w-0 flex-1 truncate">Cost incurred</span>
          <span>{formatter.format(incurred)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-green-3" />
          <span className="min-w-0 flex-1 truncate">Cost forecasted</span>
          <span>{formatter.format(forecasted)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-gray-3" />
          <span className="min-w-0 flex-1 truncate">Total Cost</span>
          <span>{formatter.format(total)}</span>
        </div>
      </div>
    </div>
  );
}
