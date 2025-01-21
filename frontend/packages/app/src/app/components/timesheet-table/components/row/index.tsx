/**
 * External dependencies
 */
import { TableCell, TableRow, Typography } from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { CircleDollarSign } from "lucide-react";
/**
 * Internal dependencies
 */
import { cn } from "@/lib/utils";
import { WorkingFrequency } from "@/types";
import { TaskDataItemProps, TaskDataProps, TaskProps } from "@/types/timesheet";
import { Cell } from "../dataCell";
import { TaskHoverCard } from "../taskHoverCard";

type RowProps = {
  dates: string[];
  tasks: TaskProps;
  holidayList: Array<string>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  importTasks?: boolean;
  loadingLikedTasks?: boolean;
  likedTaskData?: Array<object>;
  getLikedTaskData?: () => void;
  setSelectedTask: React.Dispatch<React.SetStateAction<string>>;
  setIsTaskLogDialogBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
};
const Row = ({
  dates,
  tasks,
  holidayList,
  onCellClick,
  disabled,
  likedTaskData,
  getLikedTaskData,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
}: RowProps) => {
  return (
    <>
      {Object.keys(tasks).length > 0 &&
        Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
          let totalHours = 0;
          return (
            <TableRow key={task} className="border-b border-slate-200">
              <TableCell className="cursor-pointer max-w-sm">
                <TaskHoverCard
                  name={task}
                  taskData={taskData}
                  setSelectedTask={setSelectedTask}
                  setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
                  likedTaskData={likedTaskData as TaskDataProps[]}
                  getLikedTaskData={getLikedTaskData ?? (() => {})}
                />
              </TableCell>
              {dates.map((date: string) => {
                let data = taskData.data.filter(
                  (data: TaskDataItemProps) => getDateFromDateAndTimeString(data.from_time) === date
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
                const isHoliday = holidayList.includes(date);
                return (
                  <Cell
                    key={date}
                    date={date}
                    data={data}
                    isHoliday={isHoliday}
                    onCellClick={onCellClick}
                    disabled={disabled}
                  />
                );
              })}
              <TableCell className="text-center">
                <Typography
                  variant="p"
                  className={cn(
                    "text-slate-800 font-medium text-right flex justify-between items-center",
                    !taskData.is_billable && "justify-end"
                  )}
                >
                  {taskData.is_billable == true && <CircleDollarSign className="stroke-success w-4 h-4" />}
                  {floatToTime(totalHours)}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
    </>
  );
};

export { Row };
