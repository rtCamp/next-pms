/**
 * External dependencies.
 */
import { ProgressBar } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useTracking } from "../context";
import { LegendItem } from "./legendItem";

export function HoursUsageCell() {
  const utilised = useTracking((state) => state.tracking.hours_utilised);
  const remainingRaw = useTracking((state) => state.tracking.hours_remaining);
  const remaining = remainingRaw ?? 0;
  const total = utilised + remaining;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base text-ink-gray-8 font-medium">
          Hours usage
        </span>
      </div>
      <ProgressBar
        value={utilised}
        maxValue={total}
        size="md"
        indicatorClassName="bg-surface-blue-4"
      />
      <div className="flex flex-col gap-2 text-base">
        <LegendItem
          className="bg-surface-blue-4"
          label="Hours utilised"
          value={`${utilised} h`}
          labelClassName="text-ink-gray-6"
          valueClassName="font-medium text-ink-gray-6"
        />
        <LegendItem
          className="bg-surface-gray-3"
          label="Hours remaining"
          value={`${remaining} h`}
          labelClassName="text-ink-gray-6"
          valueClassName="font-medium text-ink-gray-6"
        />
      </div>
    </div>
  );
}
