/**
 * External dependencies.
 */
import React from "react";
import { Badge, Button, Avatar } from "@rtcamp/frappe-ui-react";
import { ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { buttonVariants, statusIcon, statusTheme } from "./constants";
import { mergeClassNames as cn } from "../../../../utils";
import {
  statusLabelMap,
  type TotalHoursTheme,
  type RowStatus,
  totalHoursVariants,
} from "../constants";

export interface MemberRowProps {
  /** Name of the member. */
  label?: string;
  /** URL for the member's avatar image. */
  avatarUrl?: string;
  /** Whether the member row is collapsed or expanded. */
  collapsed?: boolean;
  /** Status of the timesheet for the member. */
  status?: RowStatus;
  /** Callback function when the action button is clicked. */
  onButtonClick?: () => void;
  /** Array of time entries for each day of the week for the member. */
  timeEntries: string[];
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
        "flex items-center border-b border-outline-gray-1 transition-colors w-full justify-between px-1 py-2",
        className,
      )}
    >
      <div className="flex items-center flex-1 min-w-0 gap-2 align-middle">
        <span
          className={cn(
            "w-4 shrink-0 transition-transform",
            collapsed ? "-rotate-90" : "rotate-0",
          )}
        >
          <ChevronDown strokeWidth={1.5} size={16} />
        </span>
        <div className="flex items-center min-w-0 gap-2">
          <Avatar image={avatarUrl} shape="circle" label={label} size="xs" />
          <span className="text-base font-medium text-ink-gray-9 truncate leading-3.5">
            {label}
          </span>
          {status !== "none" && (
            <Badge theme={statusTheme[status]} className="shrink-0">
              {statusLabelMap[status]}
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
            {timeEntry === "" ? (
              <span className="flex-1 ml-2 text-center text-ink-gray-4">-</span>
            ) : (
              <span
                className={cn(isStatusNone ? "text-ink-gray-6" : "font-medium")}
              >
                {timeEntry}
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

      <div className="flex items-center justify-end w-12 shrink-0 h-7 whitespace-nowrap">
        {!isStatusNone && statusIcon[status]?.icon ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onButtonClick?.();
            }}
            className={cn(
              buttonVariants({
                status,
                variant: statusIcon[status]?.variant,
              }),
            )}
            variant={statusIcon[status]?.variant}
            size="sm"
            icon={() => {
              const IconComponent = statusIcon[status]?.icon;
              return IconComponent ? <IconComponent size={16} /> : null;
            }}
            title={statusLabelMap[status]}
          />
        ) : null}
      </div>
    </div>
  );
};
