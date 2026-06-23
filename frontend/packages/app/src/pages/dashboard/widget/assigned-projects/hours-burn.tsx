/**
 * External dependencies.
 */
import { ProgressBar } from "@next-pms/design-system/components";
import { Tooltip } from "@rtcamp/frappe-ui-react";

export function HoursBurnBar({ used, total }: { used: number; total: number }) {
  const usedPercent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="relative flex w-full items-center py-2">
      <ProgressBar
        value={used}
        maxValue={total}
        size="sm"
        indicatorClassName="bg-surface-blue-4"
      />
      <div className="absolute inset-0 flex">
        <Tooltip text={`${used}h used`}>
          <div style={{ width: `${usedPercent}%` }} />
        </Tooltip>
        <Tooltip text={`${total}h total`}>
          <div className="grow" />
        </Tooltip>
      </div>
    </div>
  );
}
