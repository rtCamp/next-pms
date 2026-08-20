/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function UtilisedTimeCardSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-56" />
      <div className="flex items-center gap-8">
        <Skeleton className="size-[130px] shrink-0 rounded-full" />
        <div className="flex grow flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
