/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner } from "@next-pms/design-system/components";
import { CloseCircle, Hourglass, Success } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { WeeklyApprovalStatus } from "../../types";

const ICON = {
  approved: { Icon: Success, className: "text-ink-green-4" },
  pending: { Icon: Hourglass, className: "text-ink-amber-3" },
  rejected: { Icon: CloseCircle, className: "text-ink-red-4" },
  processing: { Icon: Spinner, className: "text-ink-amber-3" },
} as const;

const STATE_BY_STATUS: Record<WeeklyApprovalStatus, keyof typeof ICON> = {
  Approved: "approved",
  Rejected: "rejected",
  "Partially Rejected": "rejected",
  "Not Submitted": "pending",
  "Approval Pending": "pending",
  "Partially Approved": "pending",
  "Processing Timesheet": "processing",
};

export function StatusIcon({ status }: { status: WeeklyApprovalStatus }) {
  const { Icon, className } = ICON[STATE_BY_STATUS[status]];
  return <Icon size={16} className={cn("size-4 shrink-0", className)} />;
}
