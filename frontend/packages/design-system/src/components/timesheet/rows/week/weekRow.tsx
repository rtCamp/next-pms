/**
 * External dependencies.
 */
import React from "react";
import { Badge, Button } from "@rtcamp/frappe-ui-react";
import { ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import {
  buttonVariants,
  statusIcon,
  statusTheme,
  totalHoursVariants,
} from "./constants";
import { mergeClassNames as cn } from "../../../../utils";
import { statusLabel, type RowStatus } from "../constants";

export interface WeekRowProps {
  /** Label for the week row. */
  label?: string;
  /** Whether the week row is collapsed or expanded. */
  collapsed?: boolean;
  /** Status of the timesheet for the week. */
  status?: RowStatus;
  /** Whether the week row represents the current week. */
  thisWeek?: boolean;
  /** Callback function when the action button is clicked. */
  onButtonClick?: () => void;
  /** Array of date strings representing the days in the week. */
  dates: string[];
  /** The date string representing today's date, used for highlighting. */
  today?: string;
  /** Total hours logged for the week. */
  totalHours?: string;
  /** Additional class names for the week row container. */
  className?: string;
}

export const WeekRow: React.FC<WeekRowProps> = ({
  label = "This Week",
  collapsed = false,
  status = "not-submitted",
  thisWeek = false,
  dates,
  today = "",
  onButtonClick,
  totalHours = "",
  className,
}) => {
  const isStatusNone = status === "none";

  return (
    <div
      className={cn(
        "flex items-center border-b border-outline-gray-1 transition-colors w-full justify-between px-1 py-2 focus:ring focus:ring-outline-gray-3 rounded-sm cursor-pointer",
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
          <span className="text-base font-medium text-ink-gray-9 truncate leading-3.5">
            {label}
          </span>
          {status !== "none" && (
            <Badge theme={statusTheme[status]} className="shrink-0">
              {statusLabel[status]}
            </Badge>
          )}
        </div>
      </div>
      {!collapsed &&
        dates.map((date) => {
          const monthAndDay = date.split(" ");
          const isToday = thisWeek && date === today;
          return (
            <div
              key={date}
              className="shrink-0 flex justify-end items-center text-sm text-end text-ink-gray-5 whitespace-nowrap w-16 h-7 px-2 py-1.5 leading-3.5"
            >
              <span>
                {monthAndDay[0]}{" "}
                <span
                  className={cn(
                    isToday &&
                      "w-4.25 h-4.25 px-1 py-px rounded-sm bg-surface-red-5 text-ink-white",
                  )}
                >
                  {monthAndDay[1]}
                </span>
              </span>
            </div>
          );
        })}

      {!(isStatusNone && collapsed) && (
        <div className="shrink-0 flex justify-end items-center text-sm text-end text-ink-gray-5 whitespace-nowrap w-16 h-7 px-2 py-1.5 leading-3.5">
          <span
            className={cn(
              collapsed && totalHoursVariants({ status, thisWeek }),
            )}
          >
            {collapsed ? totalHours : "Total"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-end w-12 shrink-0 h-7 whitespace-nowrap">
        {!isStatusNone ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onButtonClick?.();
            }}
            className={cn(
              buttonVariants({
                status,
                thisWeek,
                variant: statusIcon[status]?.variant,
                collapsed,
              }),
            )}
            variant={statusIcon[status]?.variant}
            size="sm"
            icon={() => {
              const IconComponent = statusIcon[status]?.icon;
              return IconComponent ? <IconComponent size={16} /> : null;
            }}
            aria-label="Submit week"
            title={statusLabel[status]}
          />
        ) : null}
      </div>
    </div>
  );
};
