/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function ForecastBreakdownCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-8 w-44 shrink-0" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}
