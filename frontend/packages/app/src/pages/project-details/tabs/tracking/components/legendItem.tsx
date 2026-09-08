/**
 * Internal dependencies.
 */
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { mergeClassNames as cn } from "@/lib/utils";

type LegendItemProps = {
  className: string;
  label: string;
  labelTooltipText?: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function LegendItem({
  className,
  label,
  labelTooltipText,
  value,
  labelClassName,
  valueClassName,
}: LegendItemProps) {
  const labelContent = (
    <span className={cn("truncate", labelClassName)}>{label}</span>
  );

  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 shrink-0 rounded-full", className)} />
      <span className="min-w-0 flex-1">
        {labelTooltipText ? (
          <Tooltip text={labelTooltipText}>{labelContent}</Tooltip>
        ) : (
          labelContent
        )}
      </span>
      <span className={cn("shrink-0", valueClassName)}>{value}</span>
    </div>
  );
}
