/**
 * External dependencies
 */
import {
  TableCell,
  TableRow,
  Typography,
} from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { CircleDollarSign } from "lucide-react";
/**
 * Internal dependencies
 */
import { mergeClassNames } from "@/lib/utils";
import type { TaskDataItemProps, TaskDataProps } from "@/types/timesheet";
import { Cell } from "../dataCell";
import { TaskHoverCard } from "../taskHoverCard";
import type { RowProps } from "./types";

const Row = ({
  dates,
  tasks,
  holidays,
  onCellClick,
  disabled,
  likedTaskData,
  getLikedTaskData,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
  rowClassName,
  taskCellClassName,
  cellClassName,
  totalCellClassName,
  showEmptyCell,
  hideLikeButton,
}: RowProps) => {
  return (
    <>
      {Object.keys(tasks).length > 0 &&
        Object.entries(tasks).map(
          ([task, taskData]: [string, TaskDataProps]) => {
            let totalHours = 0;
            return (
              <TableRow
                key={task}
                className={mergeClassNames("border-b ", rowClassName)}
              >
                <TableCell
                  className={mergeClassNames(
                    "cursor-pointer max-w-sm",
                    taskCellClassName,
                  )}
                >
                  <TaskHoverCard
                    name={task}
                    hideLikeButton={hideLikeButton}
                    taskData={taskData}
                    setSelectedTask={setSelectedTask}
                    setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
                    likedTaskData={likedTaskData as TaskDataProps[]}
                    getLikedTaskData={getLikedTaskData ?? (() => {})}
                  />
                </TableCell>
                {dates.map((date: string) => {
                  let data = taskData.data.filter(
                    (data: TaskDataItemProps) =>
                      getDateFromDateAndTimeString(data.from_time) === date,
                  );
                  data.forEach((item: TaskDataItemProps) => {
                    totalHours += item.hours;
                  });

                  if (data.length === 0) {
                    data = [
                      {
                        hours: 0,
                        description: "",
                        name: "",
                        parent: "",
                        task: taskData.name,
                        from_time: date,
                        docstatus: 0,
                        project: taskData.project,
                        is_billable: false,
                      },
                    ];
                  }
                  const matchingHoliday = holidays.find(
                    (item) => item.holiday_date === date,
                  );

                  const result = matchingHoliday
                    ? {
                        isHoliday: true,
                        weekly_off: matchingHoliday.weekly_off,
                      }
                    : { isHoliday: false, weekly_off: false };
                  return (
                    <Cell
                      key={date}
                      className={cellClassName}
                      date={date}
                      data={data}
                      isHoliday={result.isHoliday && !result.weekly_off}
                      onCellClick={onCellClick}
                      disabled={disabled}
                    />
                  );
                })}
                <TableCell
                  className={mergeClassNames("text-center", totalCellClassName)}
                >
                  <Typography
                    variant="p"
                    className={mergeClassNames(
                      "font-medium text-right flex justify-between items-center",
                      !taskData.is_billable && "justify-end",
                    )}
                  >
                    {taskData.is_billable == true && (
                      <CircleDollarSign className="stroke-success " />
                    )}
                    {floatToTime(totalHours)}
                  </Typography>
                </TableCell>
                {showEmptyCell && (
                  <TableCell
                    className={mergeClassNames(
                      "flex max-w-20 w-full justify-center items-center",
                    )}
                  ></TableCell>
                )}
              </TableRow>
            );
          },
        )}
    </>
  );
};

export { Row };
