export const APPROVAL_STATUSES = [
  "Not Submitted",
  "Approval Pending",
  "Approved",
  "Rejected",
  "Partially Approved",
  "Partially Rejected",
  "Processing Timesheet",
] as const;

/** A timesheet's approval status. */
export type ApprovalStatusValue = (typeof APPROVAL_STATUSES)[number];

export interface ApprovalStatusIcon {
  /** `lucide-*` class icon, or `null` for frappe-ui's `Spinner`. */
  icon: string | null;
  /** `text-ink-*` colour class. */
  color: string;
}

export interface ApprovalStatusProps {
  /** Approval status to show; an unknown value renders as `Not Submitted`. */
  status: ApprovalStatusValue;
}
