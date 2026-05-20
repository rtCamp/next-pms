/**
 * External dependencies.
 */
import { Avatar, Dropdown } from "@rtcamp/frappe-ui-react";
import {
  Check,
  EditAlt,
  NotificationBell,
} from "@rtcamp/frappe-ui-react/icons";
import { parseISO } from "date-fns";
import { Diamond, Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate, mergeClassNames } from "@/lib/utils";
import { AvatarStack } from "./avatarStack";
import type { ProjectTimelineItem } from "./types";

function isDateOverdue(dateStr: string): boolean {
  return parseISO(dateStr) < new Date();
}

type MilestonesTableProps = {
  items: ProjectTimelineItem[];
  onEdit?: (item: ProjectTimelineItem) => void;
  onMarkAsCompleted?: (item: ProjectTimelineItem) => void;
  onFollowDocument?: (item: ProjectTimelineItem) => void;
};

export function MilestonesTable({
  items,
  onEdit,
  onMarkAsCompleted,
  onFollowDocument,
}: MilestonesTableProps) {
  const milestones = items.filter((i) => i.type === "Milestone");

  if (milestones.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-ink-gray-4">
        No milestones yet
      </div>
    );
  }

  return (
    <table className="w-full text-sm whitespace-nowrap">
      <thead className="">
        <tr className="border-b border-outline-gray-1 text-ink-gray-5 text-left">
          <th className="p-2 text-sm">Title</th>
          <th className="w-28 p-2 text-sm">Start date</th>
          <th className="w-28 p-2 text-sm">Planned end</th>
          <th className="w-28 p-2 text-sm">Actual end</th>
          <th className="w-28 p-2 text-sm">Owners</th>
          <th className="w-28 p-2 text-sm">Watchers</th>
        </tr>
      </thead>

      <tbody>
        {milestones.map((item) => {
          const overdue =
            !item.isComplete && isDateOverdue(item.plannedEndDate);
          return (
            <tr
              key={item.id}
              className="border-b border-outline-gray-1 last:border-b-0 hover:bg-surface-gray-1 transition-colors text-base text-ink-gray-6"
            >
              {/* Title */}
              <td className="p-2">
                <div className="flex items-center gap-2 text-ink-gray-9 ">
                  <Diamond className="size-3.5 shrink-0" />
                  <span className="font-medium truncate max-w-56">
                    {item.title}
                  </span>
                </div>
              </td>

              {/* Start date */}
              <td className="p-2">
                {item.startDate ? formatProjectDate(item.startDate) : "—"}
              </td>

              {/* Planned end */}
              <td className="p-2">
                <span
                  className={mergeClassNames(
                    overdue ? "text-red-500" : "text-ink-gray-6",
                  )}
                >
                  {formatProjectDate(item.plannedEndDate)}
                </span>
              </td>

              {/* Actual end */}
              <td className="p-2">
                {item.actualEndDate
                  ? formatProjectDate(item.actualEndDate)
                  : "—"}
              </td>

              {/* Owner */}
              <td className="p-2">
                <div className="flex items-center gap-1.5">
                  <Avatar
                    size="xs"
                    shape="circle"
                    label={item.owner.fullName}
                    image={item.owner.avatar}
                  />
                  <span>{item.owner.fullName}</span>
                </div>
              </td>

              {/* Watchers */}
              <td className="p-2">
                <AvatarStack users={item.watchers} />
              </td>

              {/* Kebab */}
              <td className="p-2">
                <Dropdown
                  dropdownClassName="border-none"
                  placement="right"
                  button={{
                    variant: "ghost",
                    icon: () => <Ellipsis size={16} />,
                  }}
                  options={[
                    {
                      label: "Edit",
                      key: "edit",
                      icon: <EditAlt className="size-4 mr-2" />,
                      onClick: () => onEdit?.(item),
                    },
                    {
                      label: "Mark as completed",
                      key: "mark-as-completed",
                      icon: <Check className="size-4 mr-2" />,
                      onClick: () => onMarkAsCompleted?.(item),
                    },
                    {
                      label: "Follow Document",
                      key: "follow-document",
                      icon: <NotificationBell className="size-4 mr-2" />,
                      onClick: () => onFollowDocument?.(item),
                    },
                  ]}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
