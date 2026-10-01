/**
 * External dependencies.
 */
import { useState } from "react";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useUpcomingTimeOff } from "./context";
import { LeaveSummaryCard } from "./leaveSummaryCard";
import type { EmployeeOnLeave } from "../../types";

interface ApproveLeaveDialogProps {
  leave: EmployeeOnLeave | null;
  onClose: () => void;
}

export function ApproveLeaveDialog({
  leave,
  onClose,
}: ApproveLeaveDialogProps) {
  const approveLeave = useUpcomingTimeOff((state) => state.approveLeave);
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!leave) return;
    setIsApproving(true);
    const approved = await approveLeave(leave.name);
    setIsApproving(false);
    if (approved) onClose();
  };

  return (
    <Dialog
      open={leave !== null}
      onOpenChange={(open) => !open && !isApproving && onClose()}
      options={{ title: "Approve leave request", size: "lg" }}
      actions={
        <div className="flex justify-end gap-2">
          <Button
            variant="subtle"
            size="md"
            disabled={isApproving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            theme="green"
            size="md"
            loading={isApproving}
            onClick={handleApprove}
          >
            Approve leave
          </Button>
        </div>
      }
    >
      {leave && (
        <div className="flex flex-col gap-4">
          <LeaveSummaryCard leave={leave} />
          <p className="text-base text-ink-gray-6">
            Approving submits this leave application. It cannot be undone from
            Next PMS.
          </p>
        </div>
      )}
    </Dialog>
  );
}
