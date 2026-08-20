/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function HeatmapCardSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-24" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[25px] w-full" />
        ))}
      </div>
      <div className="flex justify-center gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-28" />
        ))}
      </div>
    </>
  );
}
