/**
 * External dependencies
 */
import { useMemo, useCallback } from "react";
import {
  HoverCard,
  TableCell,
  HoverCardTrigger,
  Typography,
  HoverCardContent,
} from "@next-pms/design-system/components";
import { floatToTime, preProcessLink } from "@next-pms/design-system/utils";
import { CircleDollarSign, CirclePlus, PencilLine } from "lucide-react";
/**
 * Internal dependencies
 */
import { mergeClassNames, getBgCsssForToday } from "@/lib/utils";
import type { cellProps } from "./types";

/**
 * @description This is the main component for the timesheet table cell.
 * It is responsible for rendering the data in the grid, show tooltip on hover and
 * open the dialog box to add/edit time on click.
 *
 * @param {string} props.date - The date of the cell
 * @param {Array} props.data - The data for the cell
 * @param {boolean} props.isHoliday - If the date is a holiday
 * @param {Function} props.onCellClick - Function to call when the cell is clicked
 * @param {boolean} props.disabled - If the timesheet is disabled
 * @param {string} props.className - Class name for the cell
 */

export const Cell = ({ date, data, isHoliday, onCellClick, disabled, className }: cellProps) => {
  const { hours, description, isTimeBothBillableAndNonBillable, isTimeBillable } = useMemo(() => {
    let hours = 0;
    let description = "";
    let isTimeBothBillableAndNonBillable = false;
    let isTimeBillable = false;

    if (data) {
      hours = data.reduce((sum, item) => sum + (item.hours || 0), 0);
      description = data.reduce((desc, item) => desc + (item.description ? item.description + "\n" : ""), "").trim();
      isTimeBothBillableAndNonBillable =
        data.some((item) => item.is_billable === false || item.is_billable === 0) &&
        data.some((item) => item.is_billable === true || item.is_billable === 1);
      isTimeBillable = data.every((item) => item.is_billable === true || item.is_billable === 1);
    }

    return { hours, description, isTimeBothBillableAndNonBillable, isTimeBillable };
  }, [data]);

  const isDisabled = useMemo(() => disabled || data?.[0]?.docstatus === 1, [disabled, data]);

  const handleClick = useCallback(() => {
    if (isDisabled) return;
    const value = {
      date,
      hours,
      description: "",
      name: "",
      task: data?.[0]?.task ?? "",
      project: data?.[0]?.project ?? "",
    };
    onCellClick?.(value);
  }, [isDisabled, date, hours, data, onCellClick]);

  return (
    <HoverCard openDelay={1000} closeDelay={0}>
      <TableCell
        key={date}
        onClick={handleClick}
        className={mergeClassNames(
          "text-center group px-2",
          isDisabled && "cursor-default",
          "hover:h-full hover:bg-accent hover:cursor-pointer",
          getBgCsssForToday(date),
          className
        )}
      >
        <HoverCardTrigger className={mergeClassNames(isDisabled && "cursor-default")}>
          <span className="flex flex-col items-center justify-center ">
            <Typography
              variant="p"
              className={mergeClassNames(
                isHoliday || (isDisabled && "text-slate-400 dark:text-primary/50"),
                !hours && !isDisabled && "group-hover:hidden"
              )}
            >
              {hours > 0 ? floatToTime(hours) : "-"}
            </Typography>
            {(isTimeBothBillableAndNonBillable || isTimeBillable) && (
              <CircleDollarSign
                className={mergeClassNames(!isDisabled && "group-hover:hidden", isTimeBillable && "stroke-success")}
              />
            )}
            <PencilLine
              className={mergeClassNames("text-center hidden", hours > 0 && !isDisabled && "group-hover:block")}
              size={16}
            />
            <CirclePlus
              className={mergeClassNames("text-center hidden", !hours && !isDisabled && "group-hover:block ")}
              size={16}
            />
          </span>
        </HoverCardTrigger>
        {description && (
          <HoverCardContent className="text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto">
            <p dangerouslySetInnerHTML={{ __html: preProcessLink(description) }}></p>
          </HoverCardContent>
        )}
      </TableCell>
    </HoverCard>
  );
};
