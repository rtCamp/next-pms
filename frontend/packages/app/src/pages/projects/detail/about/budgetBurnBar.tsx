/**
 * Internal dependencies.
 */
import type { ProjectBudgetBurn } from "./types";

export function BudgetBurnBar({ budget }: { budget: ProjectBudgetBurn }) {
  const { current, total, projected } = budget;
  const safeTotal = total > 0 ? total : 1;
  const currentPct = Math.min(100, Math.max(0, (current / safeTotal) * 100));
  const projectedPct =
    projected !== undefined
      ? Math.min(100 - currentPct, Math.max(0, (projected / safeTotal) * 100))
      : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
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
