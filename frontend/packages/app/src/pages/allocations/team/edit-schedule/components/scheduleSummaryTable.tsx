/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import type { PreviewRow } from "../types";
import { formatRange, getRangeHours, toDisplayHours } from "../utils";

interface ScheduleSummaryTableProps {
  rows: PreviewRow[];
}

function ScheduleSummaryTable({ rows }: ScheduleSummaryTableProps) {
  return (
    <div className="overflow-hidden rounded border border-outline-gray-2">
      <table className="relative w-full table-fixed border-collapse">
        <thead className="sr-only">
          <tr>
            <th scope="col">Date range</th>
            <th scope="col">Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.startDate}_${row.endDate}`}
              className={cn(
                "h-8 border-b border-outline-gray-2 last:border-b-0 transition-opacity",
                row.isSelected && "bg-surface-gray-3",
                row.isSelected && !row.isModified && "opacity-50",
              )}
            >
              <td className="w-1/2 truncate border-r border-outline-gray-2 px-2 py-2.25 text-base text-ink-gray-6">
                {formatRange(row.startDate, row.endDate)}
              </td>
              <td className="w-1/2 px-2 py-2.25 text-base">
                <span className="text-ink-gray-6">
                  {toDisplayHours(row.hoursPerDay)}h/day
                </span>
                <span className="text-ink-gray-5">
                  {` · ${toDisplayHours(
                    getRangeHours(row.startDate, row.endDate, row.hoursPerDay),
                  )} hours`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScheduleSummaryTable;
