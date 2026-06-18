/**
 * External dependencies.
 */
import { Dialog } from "@rtcamp/frappe-ui-react";

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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{
        title: () => (
          <div className="text-xl font-semibold text-ink-gray-8">
            Detailed feedback
          </div>
        ),
        size: "4xl",
      }}
    >
      {feedbackId && <FeedbackDetailBody feedbackId={feedbackId} />}
    </Dialog>
  );
}
