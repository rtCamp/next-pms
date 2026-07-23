/**
 * External dependencies.
 */
import {
  Success,
  CloseCircle,
  Hourglass,
  Overdue,
} from "@rtcamp/frappe-ui-react/icons";
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import type { ApprovalStatusLabelType } from "./types";

export const approvalStatusIcon: Record<
  ApprovalStatusLabelType,
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  Approved: Success,
  Rejected: CloseCircle,
  "Approval Pending": Hourglass,
  "Processing Timesheet": Hourglass,
  "Not Submitted": Overdue,
  "Partially Approved": Success,
  "Partially Rejected": CloseCircle,
};

export const approvalStatusIconVariants = cva("", {
  variants: {
    status: {
      Approved: "text-ink-green-4",
      Rejected: "text-ink-red-4",
      "Approval Pending": "text-ink-amber-4",
      "Processing Timesheet": "text-ink-amber-4",
      "Not Submitted": "text-ink-gray-4",
      "Partially Approved": "text-ink-green-4",
      "Partially Rejected": "text-ink-red-4",
    },
  },
});
