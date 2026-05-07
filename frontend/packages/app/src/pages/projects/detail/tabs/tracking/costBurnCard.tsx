/**
 * External dependencies.
 */
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatCompactUSD } from "./format";
import type { CostBurnData } from "./types";

export function CostBurnCard({ data }: { data: CostBurnData }) {
  const { actual, forecasted, total } = data;
  const cap = Math.max(total, actual + forecasted);
  const actualPct = cap > 0 ? Math.min(100, (actual / cap) * 100) : 0;
  const forecastedPct = cap > 0 ? Math.min(100, (forecasted / cap) * 100) : 0;
  const ariaValueMax = Math.max(0, cap);
  const ariaValueNow = Math.min(
    ariaValueMax,
    Math.max(0, actual + forecasted),
  );

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-base font-medium text-ink-gray-8">
          Cost burn (to date)
        </h3>
        <span className="flex shrink-0 items-center gap-1 text-base font-normal text-ink-gray-6">
          All Timesheets
          <ArrowUpRight aria-hidden className="size-4" />
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ariaValueMax}
        aria-valuenow={ariaValueNow}
        className="flex h-2 w-full overflow-hidden rounded-full bg-surface-gray-3"
      >
        <div
          aria-hidden
          className="h-full bg-surface-green-5"
          style={{ width: `${actualPct}%` }}
        />
        <div
          aria-hidden
          className="h-full bg-surface-green-3"
          style={{ width: `${forecastedPct}%` }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-green-5" />
            <span className="truncate">Actual cost incurred</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-7">
            {formatCompactUSD(actual)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-green-3" />
            <span className="truncate">Forecasted cost to completion</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-7">
            {formatCompactUSD(forecasted)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-gray-3" />
            <span className="truncate">Expected total cost</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-7">
            {formatCompactUSD(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
