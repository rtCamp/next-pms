/**
 * External dependencies.
 */
import { CloseCircle, Hourglass, Success } from "@rtcamp/frappe-ui-react/icons";

const STATUS = {
  pending: { Icon: Hourglass, className: "text-ink-amber-3" },
  "on-track": { Icon: Success, className: "text-ink-green-4" },
  "off-track": { Icon: CloseCircle, className: "text-ink-red-4" },
} as const;

export type TimesheetStatus = keyof typeof STATUS;

export function DeltaStatusIcon({ status }: { status: TimesheetStatus }) {
  const { Icon, className } = STATUS[status];
  return <Icon className={`size-4 shrink-0 ${className}`} />;
}
