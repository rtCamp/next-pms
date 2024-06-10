import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  floatToTime,
  getTodayDate,
  getDateFromDateAndTime,
  isDateNotInCurrentWeek,
} from "@/app/lib/utils";
import { TaskCellClickProps } from "@/app/types/timesheet";
import { TaskCell } from "@/app/components/TaskCell";
import { LeaveRow } from "@/app/components/LeaveRow";

interface TimesheetTableBodyProps {
  tasks: Object;
  dates: Array<string>;
  holidays: Array<string>;
  leaves: any;
  onTaskCellClick: ({
    date,
    name,
    parent,
    task,
    description,
    hours,
  }: TaskCellClickProps) => void;
}

export function TimesheetTableBody({
  tasks,
  dates,
  leaves,
  holidays,
  onTaskCellClick,
}: TimesheetTableBodyProps) {
  return (
    <>
      <TableBody className="[&_tr:last-child]:border-b">
        {leaves.length > 0 && <LeaveRow dates={dates} leaves={leaves} />}
        {Object.keys(tasks).length > 0 ? (
          Object.entries(tasks).map(([task, taskData]: [string, any]) => {
            let totalHours = 0;
            return (
              <TableRow
                key={task}
                className="flex border-borderLine bg-[#F4F4F5] border-b-[1px]"
              >
                <TableCell className=" w-full max-w-md text-justify font-medium hover:cursor-pointer !px-2 py-4 truncate">
                  {task}
                </TableCell>
                {dates.map((date: string) => {
                  const isHoliday = holidays.includes(date);

                  const taskDateData = taskData.data.find(
                    (data: any) =>
                      getDateFromDateAndTime(data.from_time) === date
                  );
                  if (taskDateData && taskDateData.hours) {
                    totalHours += taskDateData.hours;
                  }
                  const leaveData = leaves.find((data: any) => {
                    return date >= data.from_date && date <= data.to_date;
                  });
                  const isCellDisabled =
                    (leaveData && !leaveData.half_day) ||
                    getTodayDate() < date ||
                    isHoliday ||
                    isDateNotInCurrentWeek(date);
                  return (
                    <TaskCell
                      onCellClick={onTaskCellClick}
                      name={taskDateData?.name ?? ""}
                      parent={taskDateData?.parent ?? ""}
                      task={taskData?.name ?? ""}
                      description={taskDateData?.description ?? ""}
                      hours={taskDateData?.hours ?? 0}
                      date={date}
                      isCellDisabled={isCellDisabled}
                    />
                  );
                })}
                <TableCell
                  key="TotlaHour"
                  className="flex w-full justify-center flex-col font-bold max-w-24 px-0 text-center hover:cursor-pointer "
                >
                  {floatToTime(totalHours)}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow className="flex">
            <TableCell className=" flex w-full font-bold items-center  justify-center text-justify font-medium border-t">
              No tasks found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </>
  );
}
