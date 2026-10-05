/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  formatLeaveDateRange,
  formatLeaveDayType,
  formatLeaveDuration,
} from "./utils";
import type { EmployeeOnLeave } from "../../types";

interface LeaveSummaryCardProps {
  leave: EmployeeOnLeave;
}

export function LeaveSummaryCard({ leave }: LeaveSummaryCardProps) {
  const reason = leave.description?.trim();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-gray-1 p-3">
      <div className="flex items-center gap-3">
        <Avatar
          size="lg"
          shape="circle"
          image={leave.user_image ?? undefined}
          label={leave.employee_name}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-medium text-ink-gray-8">
            {leave.employee_name}
          </span>
          <span className="truncate text-sm text-ink-gray-6">
            {leave.leave_type} · {formatLeaveDayType(leave)}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="text-base text-ink-gray-8">
            {formatLeaveDateRange(leave)}
          </span>
          <span className="text-sm text-ink-gray-6">
            {formatLeaveDuration(leave.total_leave_days)}
          </span>
        </div>
      </div>
      {reason && (
        <div className="flex flex-col gap-0.5 border-t border-outline-gray-1 pt-3">
          <span className="text-sm text-ink-gray-6">Reason</span>
          <p className="text-base whitespace-pre-line text-ink-gray-8">
            {reason}
          </p>
        </div>
      )}
    </div>
  );
}
