/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import { Delete, DotHorizontal, Edit } from "@rtcamp/frappe-ui-react/icons";

type ActionsCellProps = {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export function ActionsCell({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: ActionsCellProps) {
  return (
    <Dropdown
      placement="right"
      button={{
        variant: "ghost",
        icon: DotHorizontal,
      }}
      options={[
        {
          label: editLabel,
          key: "edit",
          icon: <Edit className="size-4 mr-2" />,
          onClick: onEdit,
        },
        {
          label: deleteLabel,
          key: "delete",
          theme: "red",
          icon: <Delete className="size-4 mr-2" />,
          onClick: onDelete,
        },
      ]}
    />
  );
}
