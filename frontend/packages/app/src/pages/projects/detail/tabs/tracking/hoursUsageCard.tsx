/**
 * Internal dependencies.
 */
import type { HoursUsageData } from "./types";

export function HoursUsageCard({ data }: { data: HoursUsageData }) {
  const { utilised, total } = data;
  const percent = total > 0 ? Math.min(100, Math.round((utilised / total) * 100)) : 0;
  const remaining = Math.max(0, total - utilised);
  const ariaValueMax = Math.max(0, total);
  const ariaValueNow = Math.min(ariaValueMax, Math.max(0, utilised));

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <h3 className="truncate text-base font-medium text-ink-gray-8">
        Hours usage
      </h3>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-gray-8">
          {percent}% completed
        </span>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={ariaValueMax}
          aria-valuenow={ariaValueNow}
          className="relative h-4 w-full overflow-visible rounded-[4px] bg-surface-gray-3"
        >
          <div
            aria-hidden
            className="h-full rounded-l-[4px] bg-surface-blue-4"
            style={{ width: `${percent}%` }}
          />
          <div
            aria-hidden
            className="absolute top-1/2 h-10 w-[1.5px] -translate-x-1/2 -translate-y-1/2 bg-ink-gray-7"
            style={{ left: `${percent}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-blue-4" />
            <span className="truncate">Hours utilised</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-6">
            {utilised}h
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-gray-3" />
            <span className="truncate">Hours remaining</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-6">
            {remaining}h
          </span>
        </div>
      </div>
    </div>
  );
}
