/**
 * External dependencies.
 */
import { useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { Delete, EditAlt, Reply } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { DeleteCommentDialog } from "./deleteCommentDialog";

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteConfirm = () => {
    setConfirmDelete(false);
    onDelete?.();
  };

  return (
    <>
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
            onClick={() => setConfirmDelete(true)}
          />
        ) : null}
      </div>

      <DeleteCommentDialog
        open={confirmDelete}
        isDeleting={isUpdating}
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
