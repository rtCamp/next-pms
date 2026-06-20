/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
