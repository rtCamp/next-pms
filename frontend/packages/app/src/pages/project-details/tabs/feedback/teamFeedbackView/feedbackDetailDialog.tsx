/**
 * External dependencies.
 */
import { Dialog } from "@base-ui/react/dialog";
import { Close } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { FeedbackDetailBody } from "./feedbackDetailBody";

interface FeedbackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackId: string | null;
}

export function FeedbackDetailDialog({
  open,
  onOpenChange,
  feedbackId,
}: FeedbackDetailDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black-overlay-200 backdrop-blur-md" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-surface-modal shadow-xl data-nested-dialog-open:pointer-events-none">
          <div className="flex items-center justify-between px-6 py-2.5">
            <Dialog.Title className="text-xl font-semibold text-ink-gray-8">
              Detailed feedback
            </Dialog.Title>
            <Dialog.Close className="flex items-center justify-center rounded-lg p-1.5 text-ink-gray-5 hover:bg-surface-gray-2 hover:text-ink-gray-7 transition-colors">
              <Close className="size-4" />
            </Dialog.Close>
          </div>
          <div className="px-6 pb-6">
            {feedbackId && <FeedbackDetailBody feedbackId={feedbackId} />}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
