/**
 * External dependencies.
 */
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@rtcamp/frappe-ui-react";

type DeleteCommentDialogProps = {
  open: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteCommentDialog({
  open,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteCommentDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black-overlay-200 backdrop-blur-md" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-surface-modal shadow-xl">
          <div className="px-4 pb-6 pt-5 sm:px-6">
            <div className="mb-4">
              <Dialog.Title className="text-xl font-semibold text-ink-gray-9">
                Delete comment
              </Dialog.Title>
            </div>
            <p className="text-base text-ink-gray-7">
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-1 px-4 pb-6 pt-2 sm:px-6">
            <Button
              variant="ghost"
              theme="gray"
              size="sm"
              label="Cancel"
              onClick={onClose}
              disabled={isDeleting}
            />
            <Button
              variant="solid"
              theme="red"
              size="sm"
              label="Delete"
              onClick={onConfirm}
              disabled={isDeleting}
              loading={isDeleting}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
