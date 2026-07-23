/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function UpcomingTimeOffSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-1.5 py-2">
            <Skeleton className="h-10 w-[3px] shrink-0 rounded-[5px]" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
