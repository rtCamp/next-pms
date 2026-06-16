/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { Delete, EditAlt, Reply } from "@rtcamp/frappe-ui-react/icons";

type ComponentActionsProps = {
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isUpdating: boolean;
};

export function ComponentActions({
  onReply,
  onEdit,
  onDelete,
  isUpdating,
}: ComponentActionsProps) {
  return (
    <div className="flex flex-wrap items-center">
      {onReply ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            label="Reply"
            iconLeft={Reply}
            disabled={isUpdating}
            onClick={onReply}
          />
        </>
      ) : null}

      {onReply && (onEdit || onDelete) ? (
        <span className="mx-1 h-4 w-px bg-outline-gray-3" />
      ) : null}

      {onEdit ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            label="Edit"
            iconLeft={EditAlt}
            disabled={isUpdating}
            onClick={onEdit}
          />
        </>
      ) : null}

      {onEdit && onDelete ? (
        <span className="mx-1 h-4 w-px bg-outline-gray-3" />
      ) : null}

      {onDelete ? (
        <Button
          variant="ghost"
          size="sm"
          label="Delete"
          iconLeft={Delete}
          disabled={isUpdating}
          onClick={onDelete}
        />
      ) : null}
    </div>
  );
}
