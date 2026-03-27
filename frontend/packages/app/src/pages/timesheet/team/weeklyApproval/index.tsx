/**
 * External Dependencies
 */
import { Dialog } from "@base-ui/react/dialog";

/**
 * Internal Dependencies
 */
import ApprovalPopup from "./approvalPopup";
import RejectionPopup from "./rejectionPopup";
import { WeeklyApprovalProvider, useWeeklyApproval } from "./provider";
import type { WeeklyApprovalProps } from "./types";

/**
 * Inner component that renders the modal content based on the current view.
 * Uses the WeeklyApproval context to access state and callbacks.
 */
const WeeklyApprovalContent = () => {
  const { isLoading, currentView, open, onOpenChange } = useWeeklyApproval();

  if (isLoading) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100" />
        {currentView === "approval" ? <ApprovalPopup /> : <RejectionPopup />}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/**
 * Weekly Approval modal component.
 * Wraps content with the WeeklyApprovalProvider to provide context.
 */
const WeeklyApproval = ({
  employee,
  startDate,
  open,
  onOpenChange,
}: WeeklyApprovalProps) => {
  return (
    <WeeklyApprovalProvider
      employee={employee}
      startDate={startDate}
      open={open}
      onOpenChange={onOpenChange}
    >
      <WeeklyApprovalContent />
    </WeeklyApprovalProvider>
  );
};

export default WeeklyApproval;
