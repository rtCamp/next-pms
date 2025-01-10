/**
 * External dependencies
 */
import { CircleDollarSign } from "lucide-react";
/**
 * Internal dependencies
 */
import { TableCell, TableRow } from "@design-system/components/table";
import Typography from "@design-system/components/typography";
import { cn, floatToTime, getDateFromDateAndTimeString } from "@design-system/utils";
import { HolidayProps, TaskDataItemProps, TaskDataProps, TaskProps } from "../../type";
import { getHolidayList } from "../../utils";
import Cell from "../cell";
import { TaskHoverCard } from "../taskHoverCard";

export type RowProps = {
  dates: string[];
  holidays: Array<HolidayProps>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  disabled?: boolean;
  rowClassName?: string;
  headingCellClassName?: string;
  totalCellClassName?: string;
  cellClassName?: string;
  setSelectedTask: React.Dispatch<React.SetStateAction<string>>;
  setIsTaskLogDialogBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskData: TaskProps;
};

const Row = ({
  dates,
  taskData,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
  holidays,
  disabled,
  onCellClick,
}: RowProps) => {
  if (!taskData) return <></>;
  const holidayList = getHolidayList(holidays);
  {
    Object.keys(taskData).length > 0 &&
      Object.entries(taskData).map(([task, taskData]: [string, TaskDataProps]) => {
        let totalHours = 0;
        return (
          <TableRow key={task} className="border-b border-slate-200">
            <TableCell className="cursor-pointer max-w-sm">
              <TaskHoverCard
                name={task}
                taskData={taskData}
                setSelectedTask={setSelectedTask}
                setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
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
      });
  }
};
export default Row;
