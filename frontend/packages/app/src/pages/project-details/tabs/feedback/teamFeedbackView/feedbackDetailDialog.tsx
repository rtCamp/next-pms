/**
 * External dependencies.
 */
import { Dialog } from "@base-ui/react/dialog";

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
          <div className="px-6 pb-6 pt-5">
            <Dialog.Title className="mb-4 text-xl font-semibold text-ink-gray-8">
              Detailed feedback
            </Dialog.Title>
            {feedbackId && <FeedbackDetailBody feedbackId={feedbackId} />}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
