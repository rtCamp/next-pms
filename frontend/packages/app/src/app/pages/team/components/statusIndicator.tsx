/**
 * External dependencies
 */
import { cn } from "@next-pms/design-system";
import { Hourglass, CircleCheck, CircleX } from "lucide-react";

export const StatusIndicator = ({ status, className }: { status: string; className?: string }) => {
  if (status === "Approval Pending") {
    return <Hourglass className={cn("w-4 h-4 stroke-warning", className)} />;
  }
  if (status === "Approved" || status === "Partially Approved") {
    return <CircleCheck className={cn("w-4 h-4 stroke-success", className)} />;
  }
  if (status === "Rejected" || status === "Partially Rejected") {
    return <CircleX className={cn("w-4 h-4 stroke-destructive", className)} />;
  }
  return <CircleCheck className={cn("w-4 h-4", className)} />;
};
