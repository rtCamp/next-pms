/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import {
  Check,
  EditAlt,
  NotificationBell,
} from "@rtcamp/frappe-ui-react/icons";
import { Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "../../types";

type ActionsCellProps = {
  item: ProjectTimelineItem;
  onEdit?: (item: ProjectTimelineItem) => void;
  onMarkAsCompleted?: (item: ProjectTimelineItem) => void;
  onFollowDocument?: (item: ProjectTimelineItem) => void;
};

export function ActionsCell({
  item,
  onEdit,
  onMarkAsCompleted,
  onFollowDocument,
}: ActionsCellProps) {
  return (
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
  );
}
