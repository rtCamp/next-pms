/**
 * External dependencies.
 */
import { Skeleton } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import { ROW_COLUMNS } from "../constants";

const SKELETON_ROWS = [
  { columns: 2, height: "h-52" },
  { columns: 2, height: "h-40" },
  { columns: 2, height: "h-40" },
  { columns: 3, height: "h-20" },
  { columns: 1, height: "h-56" },
  { columns: 1, height: "h-56" },
];

export function TrackingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      {SKELETON_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={cn("grid gap-3", ROW_COLUMNS[row.columns])}
        >
          {Array.from({ length: row.columns }).map((_, cellIndex) => (
            <Skeleton
              key={cellIndex}
              className={cn("w-full rounded-xl", row.height)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
