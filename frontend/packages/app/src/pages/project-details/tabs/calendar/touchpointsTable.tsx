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
import { Ellipsis, Zap } from "lucide-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate, mergeClassNames } from "@/lib/utils";
import { AvatarStack } from "./avatarStack";
import type { ProjectTimelineItem } from "./types";

function isDateOverdue(dateStr: string): boolean {
  return parseISO(dateStr) < new Date();
}

type TouchpointsTableProps = {
  items: ProjectTimelineItem[];
  onEdit?: (item: ProjectTimelineItem) => void;
  onMarkAsCompleted?: (item: ProjectTimelineItem) => void;
  onFollowDocument?: (item: ProjectTimelineItem) => void;
};

export function TouchpointsTable({
  items,
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
          <th className="p-2 text-sm">Title</th>
          <th className="p-2 text-sm w-28">Planned date</th>
          <th className="p-2 text-sm w-28">Actual date</th>
          <th className="p-2 text-sm w-28">Owners</th>
          <th className="p-2 text-sm w-28">Watchers</th>
        </tr>
      </thead>
      <tbody>
        {touchpoints.map((item) => {
          const overdue =
            !item.isComplete && isDateOverdue(item.plannedEndDate);
          return (
            <tr
              key={item.id}
              className="border-b border-outline-gray-1 last:border-b-0 hover:bg-surface-gray-1 transition-colors text-base text-ink-gray-6"
            >
              {/* Title */}
              <td className="p-2">
                <div className="flex items-center gap-2 text-ink-gray-9">
                  <Zap className="size-3.5 shrink-0" />
                  <span className="font-medium truncate max-w-56">
                    {item.title}
                  </span>
                </div>
              </td>

              {/* Planned date */}
              <td className="p-2">
                <span
                  className={mergeClassNames(
                    overdue ? "text-red-500" : "text-ink-gray-6",
                  )}
                >
                  {formatProjectDate(item.plannedEndDate)}
                </span>
              </td>

              {/* Actual date */}
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
