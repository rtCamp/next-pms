/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function UtilisedTimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <Skeleton className="h-6 w-56" />
      <div className="flex items-center gap-8">
        <Skeleton className="size-[130px] shrink-0 rounded-full" />
        <div className="flex grow flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
