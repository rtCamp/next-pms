import { ProgressBar } from "@next-pms/design-system/components";
import { useTracking } from "../context";

export function HoursUsageCell() {
  const progress = useTracking((state) => state.tracking.progress);
  const remaining = Math.max(
    progress.total_hours_purchased - progress.actual_time,
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base text-ink-gray-8 font-medium">
          Hours usage
        </span>
      </div>
      <ProgressBar
        value={progress.actual_time}
        maxValue={progress.total_hours_purchased}
        size="md"
        indicatorClassName="bg-surface-blue-4"
      />
      <div className="flex flex-col gap-2 text-base text-ink-gray-7">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-blue-4" />
          <span className="min-w-0 flex-1 truncate">Hours Utilized</span>
          <span>{progress.actual_time} h</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-gray-3" />
          <span className="min-w-0 flex-1 truncate">Hours Remaining</span>
          <span>{remaining} h</span>
        </div>
      </div>
    </div>
  );
}
