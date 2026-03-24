/**
 * External Dependencies
 */
import { useState } from "react";
import { Dialog, Button, Textarea, Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal Dependencies
 */
import type { WeeklyRejectionProps } from "./types";

// Hardcoded data
const EMPLOYEE_DATA = {
  name: "Julian Andrews",
  avatar: "",
  dateRange: "Dec 15 - 21",
  totalHours: "35:00",
};

const WeeklyRejection = ({ open, onOpenChange }: WeeklyRejectionProps) => {
  const [reason, setReason] = useState("");

  const handleReject = () => {
    // TODO: implement rejection logic
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      actions={
        <Button
          className="w-full"
          variant="solid"
          label="Reject timesheet"
          onClick={handleReject}
        />
      }
      options={{ title: "Reason for timesheet rejection" }}
    >
      <div className="space-y-4">
        {/* Employee info row */}
        <div className="flex items-center justify-between bg-surface-gray-2 rounded-md p-2 text-base font-medium">
          <div className="flex items-center gap-2 text">
            <Avatar
              size="xs"
              image={EMPLOYEE_DATA.avatar}
              label={EMPLOYEE_DATA.name}
            />
            <span className="text-ink-gray-8">{EMPLOYEE_DATA.name}</span>
            <span className="text-ink-gray-5">· {EMPLOYEE_DATA.dateRange}</span>
          </div>
          <span className="text-ink-red-4">{EMPLOYEE_DATA.totalHours}</span>
        </div>

        {/* Reason textarea */}
        <div className="space-y-1.5">
          <label className="block text-sm text-ink-gray-5">Reason</label>
          <Textarea
            value={reason}
            placeholder="Enter reason for rejection"
            onChange={(e) => setReason(e.target.value)}
            className="bg-white border-outline-gray-2"
            rows={4}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default WeeklyRejection;
