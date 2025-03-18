/**
 * External dependencies
 */
import { Button } from "@next-pms/design-system/components";
import { CircleCheck, CircleX, Clock3 } from "lucide-react";
/**
 * Internal dependencies
 */
import { mergeClassNames } from "@/lib/utils";
import type { submitButtonProps } from "./types";

/**
 * Submit Button
 * @description Button to show the status of the timesheet & to submit the timesheet.
 *
 * @param {string} props.start_date - Start date of the timesheet
 * @param {string} props.end_date - End date of the timesheet
 * @param {Function} props.onApproval - Function to call when the button is clicked
 * @param {string} props.status - Status of the timesheet
 */
export const SubmitButton = ({ start_date, end_date, onApproval, status }: submitButtonProps) => {
  const handleClick = () => {
    onApproval?.(start_date, end_date);
  };
  return (
    <Button
      variant="ghost"
      asChild
      className={mergeClassNames(
        "font-normal",
        (status == "Approved" || status == "Partially Approved") && "bg-green-50 text-success",
        (status == "Rejected" || status == "Partially Rejected") && "bg-red-50 text-destructive",
        status == "Approval Pending" && "bg-orange-50 text-warning",
        status == "Not Submitted" && "text-slate-400"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (status != "Approved") {
          handleClick();
        }
      }}
    >
      <span>
        {(status == "Approved" || status == "Partially Approved") && <CircleCheck className="stroke-success" />}
        {(status == "Rejected" || status == "Partially Rejected") && <CircleX className="stroke-destructive" />}
        {status == "Approval Pending" && <Clock3 className="stroke-warning" />}
        {status == "Not Submitted" && <CircleCheck className="" />}
        {status}
      </span>
    </Button>
  );
};
