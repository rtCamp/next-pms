/**
 * External dependencies
 */
import { mergeClassNames } from "@next-pms/design-system";
import { Hourglass, CircleCheck, CircleX, LoaderCircle } from "lucide-react";

export const StatusIndicator = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  if (status === "Approval Pending") {
    return (
      <Hourglass
        className={mergeClassNames("w-4 h-4 stroke-warning", className)}
      />
    );
  }
  if (status === "Processing Timesheet") {
    return (
      <LoaderCircle
        className={mergeClassNames(
          "w-4 h-4 stroke-warning animate-spin",
          className,
        )}
      />
    );
  }
  if (status === "Approved" || status === "Partially Approved") {
    return (
      <CircleCheck
        className={mergeClassNames("w-4 h-4 stroke-success", className)}
      />
    );
  }
  if (status === "Rejected" || status === "Partially Rejected") {
    return (
      <CircleX
        className={mergeClassNames("w-4 h-4 stroke-destructive", className)}
      />
    );
  }
  return <CircleCheck className={mergeClassNames("w-4 h-4", className)} />;
};
