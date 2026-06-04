import { ProgressBar } from "@next-pms/design-system/components";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { currencyFormat } from "@/lib/utils";
import { useTracking } from "../context";

export function CostBurnCell() {
  const burn = useTracking((state) => state.tracking.burn);
  const formatter = currencyFormat();

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
        value={burn.cost_accrued}
        secondaryValue={burn.cost_accrued + burn.cost_forecasted}
        maxValue={burn.total_budget}
        indicatorClassName="bg-surface-green-5"
        secondaryIndicatorClassName="bg-surface-green-3"
      />
      <div className="flex flex-col gap-2 text-base text-ink-gray-7">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-green-5" />
          <span className="min-w-0 flex-1 truncate">Cost incurred</span>
          <span>{formatter.format(burn.cost_accrued)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-green-3" />
          <span className="min-w-0 flex-1 truncate">Cost forecasted</span>
          <span>{formatter.format(burn.cost_forecasted)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-gray-3" />
          <span className="min-w-0 flex-1 truncate">Total Cost</span>
          <span>{formatter.format(burn.total_budget)}</span>
        </div>
      </div>
    </div>
  );
}
