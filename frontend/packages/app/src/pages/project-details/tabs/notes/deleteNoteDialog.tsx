/**
 * External dependencies.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { NOTE_PARAM } from "./constants";
import { useNotes } from "./context";

interface DeleteNoteDialogProps {
  noteName: string;
  onClose: () => void;
}

export function DeleteNoteDialog({ noteName, onClose }: DeleteNoteDialogProps) {
  const [, setSearchParams] = useSearchParams();
  const deleteNote = useNotes((s) => s.actions.deleteNote);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const deleted = await deleteNote(noteName);

    if (!deleted) {
      setDeleting(false);
      return;
    }

    setSearchParams((prev) => {
      prev.delete(NOTE_PARAM);
      return prev;
    });
    onClose();
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      options={{ title: "Delete note", size: "sm" }}
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
      <p className="text-base text-ink-gray-7">
        Are you sure you want to delete this note? This action cannot be undone.
      </p>
    </Dialog>
  );
}
