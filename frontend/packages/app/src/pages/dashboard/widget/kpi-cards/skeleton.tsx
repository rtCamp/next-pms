/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

export function KpiCardSkeleton() {
  return (
    <>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-32" />
    </>
  );
}
