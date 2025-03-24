/**
 * External dependencies
 */
import { Button } from "@next-pms/design-system/components";
import { CircleCheck, CircleX, Clock3 } from "lucide-react";
/**
 * Internal dependencies
 */
import { calculateWeeklyHour, mergeClassNames } from "@/lib/utils";
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
export const SubmitButton = ({
  start_date,
  end_date,
  onApproval,
  status,
  expectedHours,
  totalHours,
  workingFrequency,
}: submitButtonProps) => {
  const handleClick = () => {
    onApproval?.(start_date, end_date);
  };
  const expectedWeeklyHours = calculateWeeklyHour(expectedHours, workingFrequency);
  return (
    <Button
      variant="ghost"
      asChild
      className={mergeClassNames(
        "font-normal",
        (status == "Approved" || status == "Partially Approved") &&
          "bg-success/20 text-success hover:bg-success/20 hover:text-success",
        (status == "Rejected" || status == "Partially Rejected") &&
          "bg-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive",
        status == "Approval Pending" && "bg-warning/20 text-warning hover:bg-warning/20 hover:text-warning",
        status == "Not Submitted" &&
          totalHours >= expectedWeeklyHours &&
          "bg-yellow-50 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-600"
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
