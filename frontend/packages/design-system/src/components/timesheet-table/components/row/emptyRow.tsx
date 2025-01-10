/**
 * Internal dependencies
 */
import { TableCell, TableRow } from "@design-system/components/table";
import { cn } from "@design-system/utils";
import { HolidayProps, TaskDataProps } from "../../type";
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
  taskData?: TaskDataProps;
  name?: string;
};
export const EmptyRow = ({
  name,
  rowClassName,
  taskData,
  headingCellClassName,
  cellClassName,
  totalCellClassName,
  disabled,
  dates,
  holidays,
  onCellClick,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
}: RowProps) => {
  if (!taskData) return <></>;
  const holidayList = getHolidayList(holidays);
  return (
    <TableRow className={cn(rowClassName)}>
      <TableCell className={cn("max-w-sm", headingCellClassName)}>
        {name && (
          <TaskHoverCard
            taskData={taskData}
            name={name}
            setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
            setSelectedTask={setSelectedTask}
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
            cellClassName={cellClassName}
          />
        );
      })}
      <TableCell className={cn(totalCellClassName)}></TableCell>
    </TableRow>
  );
};
