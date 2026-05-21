/**
 * Internal dependencies.
 */
import { TimelineCell } from "./table/cells";
import { TOUCHPOINT_COLUMNS } from "./table/columns";
import type { ProjectTimelineItem } from "./types";

type TouchpointsTableProps = {
  items: ProjectTimelineItem[];
  userId?: string;
  onEdit?: (item: ProjectTimelineItem) => void;
  onMarkAsCompleted?: (item: ProjectTimelineItem) => void;
  onFollowDocument?: (item: ProjectTimelineItem) => void;
};

export function TouchpointsTable({
  items,
  userId,
  onEdit,
  onMarkAsCompleted,
  onFollowDocument,
}: TouchpointsTableProps) {
  const touchpoints = items.filter((i) => i.type === "Touchpoint");

  if (touchpoints.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-ink-gray-4">
        No touchpoints yet
      </div>
    );
  }

  return (
    <table className="w-full text-sm whitespace-nowrap">
      <thead>
        <tr className="border-b border-outline-gray-1 text-ink-gray-5 text-left">
          {TOUCHPOINT_COLUMNS.map((column) => (
            <th
              key={column.key}
              className={`p-2 text-sm${column.width ? ` ${column.width}` : ""}`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {touchpoints.map((item) => (
          <tr
            key={item.id}
            className="border-b border-outline-gray-1 last:border-b-0 hover:bg-surface-gray-1 transition-colors text-base text-ink-gray-6"
          >
            {TOUCHPOINT_COLUMNS.map((column) => (
              <td key={column.key} className="p-2">
                <TimelineCell
                  item={item}
                  column={column}
                  userId={userId}
                  onEdit={onEdit}
                  onMarkAsCompleted={onMarkAsCompleted}
                  onFollowDocument={onFollowDocument}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
