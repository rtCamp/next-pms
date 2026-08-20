/**
 * External dependencies.
 */
import { ProgressBar } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { formatHours } from "@/lib/utils";
import { useTracking } from "../context";
import { LegendItem } from "./legendItem";

export function HoursUsageCell() {
  const billable = useTracking(
    (state) => state.tracking.hours_utilised_billable,
  );
  const nonBillable = useTracking(
    (state) => state.tracking.hours_utilised_non_billable,
  );
  const utilised = useTracking((state) => state.tracking.hours_utilised);
  const remainingRaw = useTracking((state) => state.tracking.hours_remaining);
  const remaining = remainingRaw ?? 0;
  const contracted = utilised + remaining;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between">
        <span className="text-base text-ink-gray-8 font-medium">
          Hours usage
        </span>
      </div>
      <ProgressBar
        value={billable}
        secondaryValue={billable + nonBillable}
        maxValue={contracted}
        size="md"
        indicatorClassName="bg-surface-blue-5"
        secondaryIndicatorClassName="bg-surface-blue-2"
      />
      <div className="flex flex-col gap-2 text-base">
        <LegendItem
          className="bg-surface-blue-5"
          label="Billable hours utilised"
          value={formatHours(billable, " h")}
          labelClassName="text-ink-gray-6"
          valueClassName="font-medium text-ink-gray-6"
        />
        <LegendItem
          className="bg-surface-blue-2"
          label="Non-billable hours utilised"
          value={formatHours(nonBillable, " h")}
          labelClassName="text-ink-gray-6"
          valueClassName="font-medium text-ink-gray-6"
        />
        <LegendItem
          className="bg-surface-gray-5"
          label="Total hours utilised"
          value={formatHours(utilised, " h")}
          labelClassName="text-ink-gray-6"
          valueClassName="font-medium text-ink-gray-6"
        />
        <LegendItem
          className="bg-surface-gray-3"
          label="Total hours remaining"
          value={formatHours(remaining, " h")}
          labelClassName="text-ink-gray-6"
          valueClassName="font-medium text-ink-gray-6"
        />
      </div>
    </div>
  );
}
