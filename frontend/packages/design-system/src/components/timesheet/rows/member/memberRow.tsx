/**
 * External dependencies.
 */
import React from "react";
import { Badge, Button, Avatar } from "@rtcamp/frappe-ui-react";
import { ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { buttonVariants, memberStatusIcon } from "./constants";
import { mergeClassNames as cn } from "../../../../utils";
import {
  ApprovalStatusLabelMap,
  type TotalHoursTheme,
  type ApprovalStatusType,
  totalHoursVariants,
  approvalStatusTheme,
} from "../constants";

export interface MemberRowProps {
  /** Name of the member. */
  label?: string;
  /** URL for the member's avatar image. */
  avatarUrl?: string;
  /** Whether the member row is collapsed or expanded. */
  collapsed?: boolean;
  /** Status of the timesheet for the member. */
  status?: ApprovalStatusType;
  /** Callback function when the action button is clicked. */
  onButtonClick?: () => void;
  /** Array of time entries for each day of the week for the member. */
  timeEntries: { date: string; time: string }[];
  /** Total hours logged for the week. */
  totalHours?: string;
  /** Theme for the total hours */
  totalHoursTheme?: TotalHoursTheme;
  /** Additional class names for the member row container. */
  className?: string;
}

export const MemberRow: React.FC<MemberRowProps> = ({
  label,
  avatarUrl,
  collapsed = false,
  status = "not-submitted",
  timeEntries,
  onButtonClick,
  totalHours = "",
  totalHoursTheme,
  className,
}) => {
  const isStatusNone = status === "none";

  return (
    <div
      className={cn(
        "flex justify-between items-center px-1 py-2 w-full border-b transition-colors border-outline-gray-1",
        className,
      )}
    >
      <div className="flex flex-1 gap-2 items-center min-w-0 align-middle">
        <span
          className={cn(
            "w-4 transition-transform shrink-0",
            collapsed ? "-rotate-90" : "rotate-0",
          )}
        >
          <ChevronDown strokeWidth={1.5} size={16} />
        </span>
        <div className="flex gap-2 items-center min-w-0">
          <Avatar image={avatarUrl} shape="circle" label={label} size="xs" />
          <span className="text-base font-medium text-ink-gray-9 leading-3.5">
            {label}
          </span>
          {status !== "none" && (
            <Badge theme={approvalStatusTheme[status]} className="shrink-0">
              {ApprovalStatusLabelMap[status]}
            </Badge>
          )}
        </div>
      </div>
      {timeEntries.map((timeEntry, index) => {
        return (
          <div
            key={index}
            className="shrink-0 flex justify-end items-center text-base text-ink-gray-9 whitespace-nowrap w-16 h-7 px-2 py-1.5 leading-3.5 lining-nums tabular-nums"
          >
            {timeEntry.time === "" ? (
              <span className="flex-1 ml-2 text-center text-ink-gray-4">-</span>
            ) : (
              <span
                className={cn(isStatusNone ? "text-ink-gray-6" : "font-medium")}
              >
                {timeEntry.time}
              </span>
            )}
          </div>
        );
      })}

      <div className="shrink-0 flex justify-end items-center text-sm text-end text-ink-gray-5 whitespace-nowrap w-16 h-7 px-2 py-1.5 leading-3.5">
        <span className={cn(totalHoursVariants({ theme: totalHoursTheme }))}>
          {totalHours}
        </span>
      </div>

      <div className="flex justify-end items-center w-12 h-7 whitespace-nowrap shrink-0">
        {!isStatusNone && memberStatusIcon[status]?.icon ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onButtonClick?.();
            }}
            className={cn(
              buttonVariants({
                status,
                variant: memberStatusIcon[status]?.variant,
              }),
            )}
            variant={memberStatusIcon[status]?.variant}
            size="sm"
            icon={() => {
              const IconComponent = memberStatusIcon[status]?.icon;
              return IconComponent ? <IconComponent size={16} /> : null;
            }}
            title={ApprovalStatusLabelMap[status]}
          />
        ) : null}
      </div>
    </div>
  );
};
