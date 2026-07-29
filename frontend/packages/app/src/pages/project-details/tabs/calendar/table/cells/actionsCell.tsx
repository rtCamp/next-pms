/**
 * External dependencies.
 */
import { useState } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import { Dropdown } from "@rtcamp/frappe-ui-react";
import {
  Check,
  DeleteAlt,
  EditAlt,
  NotificationBell,
  NotificationOff,
  DotHorizontal,
  Reset,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useCalendar } from "../../context";
import type { ProjectTimelineItem } from "../../types";

type ActionsCellProps = {
  item: ProjectTimelineItem;
};

export function ActionsCell({ item }: ActionsCellProps) {
  const userId = useCalendar((c) => c.state.userId);
  const onEdit = useCalendar((c) => c.actions.onEdit);
  const onMarkAsCompleted = useCalendar((c) => c.actions.onMarkAsCompleted);
  const onFollowDocument = useCalendar((c) => c.actions.onFollowDocument);
  const onDelete = useCalendar((c) => c.actions.onDelete);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const isFollowing = userId
    ? item.watchers.some((w) => w.name === userId)
    : false;

  return (
    <>
      <Dropdown
        dropdownClassName="border-none"
        placement="right"
        button={{
          className: "h-4",
          variant: "ghost",
          icon: () => <DotHorizontal size={16} />,
        }}
        options={[
          {
            label: "Edit",
            key: "edit",
            icon: <EditAlt className="size-4 mr-2" />,
            onClick: () => onEdit(item),
          },
          {
            label: item.isComplete ? "Mark as incomplete" : "Mark as completed",
            key: "mark-as-completed",
            icon: item.isComplete ? (
              <Reset className="size-4 mr-2" />
            ) : (
              <Check className="size-4 mr-2" />
            ),
            onClick: () => onMarkAsCompleted(item),
          },
          {
            label: isFollowing ? "Unfollow Document" : "Follow Document",
            key: "follow-document",
            icon: isFollowing ? (
              <NotificationOff className="size-4 mr-2" />
            ) : (
              <NotificationBell className="size-4 mr-2" />
            ),
            onClick: () => onFollowDocument(item),
          },
          {
            label: "Delete",
            key: "delete",
            theme: "red",
            icon: <DeleteAlt className="size-4 mr-2" />,
            onClick: () => setConfirmDelete(true),
          },
        ]}
      />

      {confirmDelete && (
        <DeleteActionDialog
          title={`Delete ${item.type.toLowerCase()}`}
          description={`Are you sure you want to delete this ${item.type.toLowerCase()}? This action cannot be undone.`}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => onDelete(item)}
        />
      )}
    </>
  );
}
