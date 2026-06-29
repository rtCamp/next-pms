/**
 * External dependencies.
 */
import { DEFAULT_VISIBLE_DAYS } from "@next-pms/design-system/components";
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function CalendarTimelineCardSkeleton() {
  const columnStyle = {
    gridTemplateColumns: `repeat(${DEFAULT_VISIBLE_DAYS}, minmax(0, 1fr))`,
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-6 w-44" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="grid overflow-hidden rounded-lg" style={columnStyle}>
        {Array.from({ length: DEFAULT_VISIBLE_DAYS }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[140px] flex-col gap-2 border-b border-l border-t border-outline-gray-1 p-2"
          >
            <Skeleton className="h-4 w-6 self-end" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
