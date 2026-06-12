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
    <div className="overflow-hidden rounded-lg border border-outline-gray-2">
      <table className="w-full table-fixed border-collapse">
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.startDate}_${row.endDate}`}
              className={cn(
                "border-b border-outline-gray-2 last:border-b-0 transition-opacity",
                row.isSelected && "bg-surface-gray-2",
                row.isSelected && !row.isModified && "opacity-50",
              )}
            >
              <td className="w-1/2 truncate border-r border-outline-gray-2 px-3 py-2.5 text-sm text-ink-gray-6">
                {formatRange(row.startDate, row.endDate)}
              </td>
              <td className="w-1/2 px-3 py-2.5 text-sm">
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
