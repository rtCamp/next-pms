/**
 * External Dependencies
 */
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { floatToTime } from "@next-pms/design-system";
import { Avatar, Button, Textarea } from "@rtcamp/frappe-ui-react";
import { X } from "lucide-react";

/**
 * Internal Dependencies
 */
import { useWeeklyApproval } from "./provider";

const RejectionPopup = () => {
  const {
    employeeName,
    avatarUrl,
    dateRange,
    totalHours,
    handleRejectionSubmit,
  } = useWeeklyApproval();
  const [reason, setReason] = useState("");

  const handleReject = () => {
    handleRejectionSubmit(reason);
  };

  return (
    <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 z-101 bg-surface-modal rounded-xl shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-gray-modals">
        <h1 className="text-2xl font-semibold text-ink-gray-8">
          Reason for timesheet rejection
        </h1>
        <Dialog.Close className="p-1 hover:bg-surface-gray-2 rounded">
          <X className="h-5 w-5 text-ink-gray-5" />
        </Dialog.Close>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Employee info row */}
        <div className="flex items-center justify-between bg-surface-gray-2 rounded-md p-2 text-base font-medium">
          <div className="flex items-center gap-2">
            <Avatar size="xs" image={avatarUrl} label={employeeName} />
            <span className="text-ink-gray-7">{employeeName}</span>
            <span className="text-ink-gray-5 font-[420]">· {dateRange}</span>
          </div>
          <span className="text-ink-red-4">
            {floatToTime(totalHours, 2, 2)}
          </span>
        </div>

        {/* Reason textarea */}
        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-5">Reason</label>
          <Textarea
            value={reason}
            placeholder="Enter reason for rejection"
            onChange={(e) => setReason(e.target.value)}
            className="bg-white border-outline-gray-2 text-ink-gray-7"
            rows={4}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pt-0">
        <Button
          className="w-full"
          variant="solid"
          label="Reject timesheet"
          onClick={handleReject}
        />
      </div>
    </Dialog.Popup>
  );
};

export default RejectionPopup;
