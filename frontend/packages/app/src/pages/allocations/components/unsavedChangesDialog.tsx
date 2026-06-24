/**
 * External dependencies.
 */
import { Button, Dialog } from "@rtcamp/frappe-ui-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscardChanges: () => void;
  onKeepEditing: () => void;
  onSaveChanges: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscardChanges,
  onKeepEditing,
  onSaveChanges,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      options={{
        title: () => <span className="text-lg font-medium">Save Changes</span>,
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2 -mt-5">
          <Button
            variant="ghost"
            label="Discard Changes"
            onClick={onDiscardChanges}
          />
          <Button
            variant="subtle"
            label="Keep Editing"
            onClick={onKeepEditing}
          />
          <Button
            variant="solid"
            label="Save Changes"
            onClick={onSaveChanges}
          />
        </div>
      }
    >
      <div className="-mt-2">
        <p className="text-base text-ink-gray-6">
          You have unsaved changes. Would you like to save them before leaving?
        </p>
      </div>
    </Dialog>
  );
}

UnsavedChangesDialog.displayName = "UnsavedChangesDialog";
