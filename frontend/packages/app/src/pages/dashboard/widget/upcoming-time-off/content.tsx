/**
 * External dependencies.
 */
import { useState } from "react";
import { mergeClassNames } from "@next-pms/design-system";
import { Avatar, Badge, Button } from "@rtcamp/frappe-ui-react";
import { Check, Close } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useUpcomingTimeOff } from "./context";
import { RejectLeaveDialog } from "./rejectLeaveDialog";
import { UpcomingTimeOffSkeleton } from "./skeleton";
import { formatLeaveWindow } from "./utils";
import type { EmployeeOnLeave } from "../../types";

export function UpcomingTimeOffContent() {
  const leaves = useUpcomingTimeOff((state) => state.leaves);
  const pendingCount = useUpcomingTimeOff((state) => state.pendingCount);
  const isLoading = useUpcomingTimeOff((state) => state.isLoading);
  const approveLeave = useUpcomingTimeOff((state) => state.approveLeave);
  const [rejectingLeave, setRejectingLeave] = useState<EmployeeOnLeave | null>(
    null,
  );

  if (isLoading) {
    return <UpcomingTimeOffSkeleton />;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Upcoming time-offs
        </h3>
        {pendingCount > 0 && (
          <Badge
            theme="orange"
            size="lg"
            prefix={
              <span className="block size-1.5 rounded-full bg-surface-amber-3" />
            }
          >
            {pendingCount} pending
          </Badge>
        )}
      </div>
      {leaves.length === 0 ? (
        <p className="py-8 text-center text-base text-ink-gray-5">
          No upcoming time-offs.
        </p>
      ) : (
        <ul className="flex flex-col">
          {leaves.map((leave) => (
            <li
              key={leave.name}
              className={mergeClassNames(
                "flex items-center gap-3 border-b border-l-[3px] border-b-outline-gray-1 px-3 py-2.5 last:border-b-0",
                leave.status === "Open"
                  ? "border-l-outline-amber-2 bg-surface-amber-1"
                  : "border-l-transparent",
              )}
            >
              <Avatar
                size="md"
                shape="circle"
                image={leave.user_image ?? undefined}
                label={leave.employee_name}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-medium text-ink-gray-8">
                  {leave.employee_name}
                </span>
                <span className="text-sm text-ink-gray-6">
                  {formatLeaveWindow(leave)}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge
                  theme={leave.status === "Open" ? "orange" : "green"}
                  size="lg"
                  label={leave.status}
                />
                {leave.status === "Open" && (
                  <div className="flex gap-1.5">
                    <Button
                      variant="solid"
                      theme="green"
                      icon={() => (
                        <Check size={16} className="text-ink-white" />
                      )}
                      onClick={() => approveLeave(leave.name)}
                      className="bg-surface-green-5"
                    />
                    <Button
                      variant="solid"
                      theme="red"
                      icon={() => (
                        <Close size={16} className="text-ink-white" />
                      )}
                      onClick={() => setRejectingLeave(leave)}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <RejectLeaveDialog
        leave={rejectingLeave}
        onClose={() => setRejectingLeave(null)}
      />
    </>
  );
}
