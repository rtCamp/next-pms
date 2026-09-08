/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

export function TaskRowActions({
  name,
  onEdit,
  onDelete,
  canDelete = false,
}: {
  name: string;
  onEdit?: (name: string) => void;
  onDelete?: (name: string) => void;
  canDelete?: boolean;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown
        placement="center"
        button={{
          variant: "ghost",
          icon: DotHorizontal,
          "aria-label": "Task actions",
        }}
        options={
          canDelete
            ? [
                {
                  key: "edit",
                  label: "Edit",
                  onClick: () => onEdit?.(name),
                },
                {
                  key: "delete",
                  label: "Delete",
                  theme: "red",
                  onClick: () => onDelete?.(name),
                },
              ]
            : [
                {
                  key: "edit",
                  label: "Edit",
                  onClick: () => onEdit?.(name),
                },
              ]
        }
      />
    </div>
  );
}
