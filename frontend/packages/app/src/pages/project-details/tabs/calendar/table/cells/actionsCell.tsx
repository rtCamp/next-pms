/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import {
  Check,
  EditAlt,
  NotificationBell,
  NotificationOff,
} from "@rtcamp/frappe-ui-react/icons";
import { Ellipsis, RotateCcw } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "../../types";

type ActionsCellProps = {
  item: ProjectTimelineItem;
  userId?: string;
  onEdit?: (item: ProjectTimelineItem) => void;
  onMarkAsCompleted?: (item: ProjectTimelineItem) => void;
  onFollowDocument?: (item: ProjectTimelineItem) => void;
};

export function ActionsCell({
  item,
  userId,
  onEdit,
  onMarkAsCompleted,
  onFollowDocument,
}: ActionsCellProps) {
  const isFollowing = userId
    ? item.watchers.some((w) => w.name === userId)
    : false;

  return (
    <Dropdown
      dropdownClassName="border-none"
      placement="right"
      button={{
        className: "h-4",
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
          label: item.isComplete ? "Mark as incomplete" : "Mark as completed",
          key: "mark-as-completed",
          icon: item.isComplete ? (
            <RotateCcw className="size-4 mr-2" />
          ) : (
            <Check className="size-4 mr-2" />
          ),
          onClick: () => onMarkAsCompleted?.(item),
        },
        {
          label: isFollowing ? "Unfollow Document" : "Follow Document",
          key: "follow-document",
          icon: isFollowing ? (
            <NotificationOff className="size-4 mr-2" />
          ) : (
            <NotificationBell className="size-4 mr-2" />
          ),
          onClick: () => onFollowDocument?.(item),
        },
      ]}
    />
  );
}
