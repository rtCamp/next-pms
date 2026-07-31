/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "../types";
import { TimelineCell } from "./cells";
import type { TableColumn } from "./columns";

type TimelineTableProps = {
  items: ProjectTimelineItem[];
  columns: TableColumn[];
  emptyMessage: string;
};

export function TimelineTable({
  items,
  columns,
  emptyMessage,
}: TimelineTableProps) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-ink-gray-4">
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="w-full text-sm whitespace-nowrap">
      <thead>
        <tr className="border-b border-outline-gray-1 text-ink-gray-5 text-left">
          {columns.map((column) => (
            <th
              key={column.key}
              className={cn("px-2 py-1.5 text-sm", column.width)}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className="border-b border-outline-gray-1 last:border-b-0 hover:bg-surface-gray-1 transition-colors text-base text-ink-gray-6"
          >
            {columns.map((column) => (
              <td key={column.key} className="py-3 px-2">
                <TimelineCell item={item} column={column} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
