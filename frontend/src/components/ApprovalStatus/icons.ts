import type { ApprovalStatusIcon, ApprovalStatusValue } from "./types";

export const APPROVAL_STATUS_ICONS: Record<
  ApprovalStatusValue,
  ApprovalStatusIcon
> = {
  "Not Submitted": { icon: "lucide-timer", color: "text-ink-gray-4" },
  "Approval Pending": { icon: "lucide-hourglass", color: "text-ink-amber-4" },
  Approved: { icon: "lucide-circle-check", color: "text-ink-green-4" },
  Rejected: { icon: "lucide-circle-x", color: "text-ink-red-4" },
  "Partially Approved": {
    icon: "lucide-circle-check",
    color: "text-ink-green-4",
  },
  "Partially Rejected": { icon: "lucide-circle-x", color: "text-ink-red-4" },
  "Processing Timesheet": { icon: null, color: "text-ink-amber-4" },
};
