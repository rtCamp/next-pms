/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";

type LegendItemProps = {
  className: string;
  label: string;
  value: string;
};

export function LegendItem({ className, label, value }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={mergeClassNames("size-2 shrink-0 rounded-full", className)}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span>{value}</span>
    </div>
  );
}
