/**
 * External dependencies
 */
import { mergeClassNames } from "@next-pms/design-system";
import { Hourglass, CircleCheck, CircleX, CircleDot } from "lucide-react";

export const StatusIndicator = ({ status, className }: { status: string; className?: string }) => {
  if (status === "Approval Pending") {
    return <Hourglass className={mergeClassNames("w-4 h-4 stroke-warning", className)} />;
  }
  if (status === "Processing Timesheet") {
    return <CircleDot className={mergeClassNames("w-4 h-4 stroke-blue-600", className)} />;
  }
  if (status === "Approved" || status === "Partially Approved") {
    return <CircleCheck className={mergeClassNames("w-4 h-4 stroke-success", className)} />;
  }
  if (status === "Rejected" || status === "Partially Rejected") {
    return <CircleX className={mergeClassNames("w-4 h-4 stroke-destructive", className)} />;
  }
  return <CircleCheck className={mergeClassNames("w-4 h-4", className)} />;
};
