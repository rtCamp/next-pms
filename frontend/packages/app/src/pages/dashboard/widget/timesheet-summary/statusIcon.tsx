/**
 * External dependencies.
 */
import { CloseCircle, Hourglass, Success } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { WeeklyApprovalStatus } from "../../types";

const ICON = {
  approved: { Icon: Success, className: "text-ink-green-4" },
  pending: { Icon: Hourglass, className: "text-ink-amber-3" },
  rejected: { Icon: CloseCircle, className: "text-ink-red-4" },
} as const;

const STATE_BY_STATUS: Record<WeeklyApprovalStatus, keyof typeof ICON> = {
  Approved: "approved",
  Rejected: "rejected",
  "Partially Rejected": "rejected",
  "Not Submitted": "pending",
  "Approval Pending": "pending",
  "Partially Approved": "pending",
  "Processing Timesheet": "pending",
};

export function StatusIcon({ status }: { status: WeeklyApprovalStatus }) {
  const { Icon, className } = ICON[STATE_BY_STATUS[status]];
  return <Icon className={`size-4 shrink-0 ${className}`} />;
}
