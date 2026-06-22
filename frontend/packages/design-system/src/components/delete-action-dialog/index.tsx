/**
 * External dependencies.
 */
import { useState } from "react";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";

interface DeleteActionDialogProps {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteActionDialog({
  title,
  description,
  onClose,
  onConfirm,
}: DeleteActionDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      options={{ title, size: "sm" }}
      actions={
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            theme="gray"
            size="sm"
            label="Cancel"
            onClick={onClose}
            disabled={deleting}
          />
          <Button
            variant="solid"
            theme="red"
            size="sm"
            label="Delete"
            onClick={() => void handleDelete()}
            disabled={deleting}
            loading={deleting}
          />
        </div>
      }
    >
      <p className="text-base text-ink-gray-7">{description}</p>
    </Dialog>
  );
}
