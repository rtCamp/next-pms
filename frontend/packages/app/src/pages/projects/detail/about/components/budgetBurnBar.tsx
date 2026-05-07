/**
 * Internal dependencies.
 */
import type { ProjectBudgetBurn } from "./types";

export function BudgetBurnBar({ budget }: { budget: ProjectBudgetBurn }) {
  const { current, total, projected } = budget;
  const hasValidTotal = total > 0;
  const currentPct = hasValidTotal
    ? Math.min(100, Math.max(0, (current / total) * 100))
    : 0;
  const projectedPct =
    hasValidTotal && projected !== undefined
      ? Math.min(100 - currentPct, Math.max(0, (projected / total) * 100))
      : 0;
  const ariaValueMax = Math.max(0, total);
  const ariaValueNow = Math.min(ariaValueMax, Math.max(0, current));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={ariaValueMax}
      aria-valuenow={ariaValueNow}
      className="relative h-2 w-full overflow-hidden rounded-full bg-surface-gray-2"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full bg-surface-green-5"
        style={{ width: `${currentPct}%` }}
      />
      {projectedPct > 0 ? (
        <span
          aria-hidden
          className="absolute top-0 h-full bg-surface-green-3"
          style={{ left: `${currentPct}%`, width: `${projectedPct}%` }}
        />
      ) : null}
    </div>
  );
}
