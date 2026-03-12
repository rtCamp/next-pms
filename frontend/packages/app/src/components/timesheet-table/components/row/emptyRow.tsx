/**
 * External dependencies
 */
import { TableCell, TableRow } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { mergeClassNames } from "@/lib/utils";
import type { TaskDataProps } from "@/types/timesheet";
import { Cell } from "../dataCell";
import { TaskHoverCard } from "../taskHoverCard";
import type { emptyRowProps } from "./types";

/**
 * Empty Row
 * @description The component shows table row with empty cells in timesheet grid,
 * which onClick event opens the dialog box to add time.
 *
 * @param {Array} props.dates - Array of dates in the timesheet
 * @param {Array} props.holidays - Array of holidays in the timesheet
 * @param {Function} props.onCellClick - Function to call when the cell is clicked
 * @param {boolean} props.disabled - If the timesheet is disabled
 * @param {string} props.rowClassName - Class name for the row
 * @param {string} props.headingCellClassName - Class name for the heading cell
 * @param {string} props.totalCellClassName - Class name for the total cell
 * @param {string} props.cellClassName - Class name for the cell
 */
export const EmptyRow = ({
  dates,
  holidayList,
  onCellClick,
  disabled,
  rowClassName,
  headingCellClassName,
  totalCellClassName,
  cellClassName,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
  taskData,
  name,
  likedTaskData,
  getLikedTaskData,
}: emptyRowProps) => {
  return (
    <TableRow className={mergeClassNames(rowClassName)}>
      <TableCell className={mergeClassNames("max-w-sm", headingCellClassName)}>
        {name && (
          <TaskHoverCard
            taskData={taskData}
            name={name}
            setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen ?? (() => {})}
            setSelectedTask={setSelectedTask ?? (() => {})}
            likedTaskData={likedTaskData as TaskDataProps[]}
            getLikedTaskData={getLikedTaskData ?? (() => {})}
          />
        )}
      </TableCell>
      {dates.map((date: string) => {
        const isHoliday = holidayList.includes(date);
        const value = [
          {
            hours: 0,
            description: "",
            name: "",
            docstatus: 0 as 0 | 1,
            is_billable: false,
            from_time: date,
            task: taskData?.name ?? "",
            parent: "",
            project: taskData?.project ?? "",
          },
        ];
        return (
          <Cell
            key={date}
            date={date}
            data={value}
            isHoliday={isHoliday}
            onCellClick={onCellClick}
            disabled={disabled}
            className={cellClassName}
          />
        );
      })}
      <TableCell className={mergeClassNames(totalCellClassName)}></TableCell>
    </TableRow>
  );
};
