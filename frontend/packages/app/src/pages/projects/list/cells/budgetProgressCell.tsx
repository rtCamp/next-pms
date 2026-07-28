/**
 * External dependencies.
 */
import { BudgetBurnBar } from "@next-pms/design-system/components";

export function BudgetProgressCell({
  percent,
  secondaryPercent,
  markerPercent,
}: {
  percent: number;
  secondaryPercent?: number;
  markerPercent?: number;
}) {
  return (
    <div className="w-full pr-2">
      <BudgetBurnBar
        value={percent}
        secondaryValue={secondaryPercent}
        markerValue={markerPercent}
        size="sm"
      />
    </div>
  );
}
