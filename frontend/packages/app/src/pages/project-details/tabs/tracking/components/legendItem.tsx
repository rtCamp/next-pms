/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";

type LegendItemProps = {
  className: string;
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function LegendItem({
  className,
  label,
  value,
  labelClassName,
  valueClassName,
}: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 shrink-0 rounded-full", className)} />
      <span className={cn("min-w-0 flex-1 truncate", labelClassName)}>
        {label}
      </span>
      <span className={cn(valueClassName)}>{value}</span>
    </div>
  );
}
