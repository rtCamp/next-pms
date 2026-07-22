/**
 * Internal dependencies.
 */
import { approvalStatusIcon, approvalStatusIconVariants } from "./constants";
import type { ApprovalStatusLabelType } from "./types";
import { mergeClassNames as cn } from "../../utils";

export type { ApprovalStatusLabelType } from "./types";

interface ApprovalStatusProps {
  status: ApprovalStatusLabelType;
  className?: string;
}

const ApprovalStatus = ({ status, className }: ApprovalStatusProps) => {
  const StatusIcon = approvalStatusIcon[status];

  return (
    <span className={cn("w-4 shrink-0", className)}>
      <StatusIcon
        strokeWidth={1.5}
        size={16}
        className={approvalStatusIconVariants({ status })}
      />
    </span>
  );
};

export default ApprovalStatus;
