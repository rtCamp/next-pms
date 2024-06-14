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
import { Typography } from "@/app/components/Typography";

interface TimesheetTableBodyProps {
  tasks: Object;
  dates: Array<string>;
  holidays: Array<string>;
  leaves: any;
  hours: any;
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
  hours,
  onTaskCellClick,
}: TimesheetTableBodyProps) {
  let total = 0;
  return (
    <>
      <TableBody className="[&_tr:last-child]:border-b">
        {Object.keys(tasks).length > 0 && (
          <TableRow className="flex  bg-primary border-b-[1px] hover:bg-primary/60">
            <TableCell className=" w-full max-w-sm text-justify font-medium hover:cursor-not-allowed !px-2 py-4"></TableCell>
            {hours.map((hour: any, index: number) => {
              total += hour.hours;
              return (
                <TaskCell
                  classname="text-foreground  hover:cursor-not-allowed"
                  onCellClick={() => {}}
                  name={""}
                  parent={""}
                  task={""}
                  description={`Total working hours for the day is ${floatToTime(
                    hour.hours
                  )}`}
                  hours={hour.hours}
                  date={hour.date}
                  isCellDisabled={true}
                />
              );
            })}
            <TableCell
              key={"Total"}
              className="flex w-full justify-center flex-col font-bold max-w-24 px-0 text-center  hover:cursor-not-allowed "
            >
              {floatToTime(total)}
            </TableCell>
          </TableRow>
        )}
        {leaves.length > 0 && <LeaveRow dates={dates} leaves={leaves} />}
        {Object.keys(tasks).length > 0 ? (
          Object.entries(tasks).map(([task, taskData]: [string, any]) => {
            let totalHours = 0;
            return (
              <TableRow
                key={task}
                className="flex  bg-primary border-b-[1px] hover:bg-primary/60"
              >
                <TableCell className=" w-full max-w-sm text-justify font-medium hover:cursor-pointer !px-2 py-4">
                  <Typography
                    variant="p"
                    className="truncate sm:text-sm !font-medium"
                  >
                    {task}
                  </Typography>
                  <Typography
                    variant="muted"
                    className="truncate !font-medium text-[13px]"
                  >
                    {taskData.project}
                  </Typography>
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
                      onCellClick={!isCellDisabled ? onTaskCellClick : () => {}}
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
                  key={"TotalHour" + task}
                  className="flex w-full justify-center flex-col font-bold max-w-24 px-0 text-center hover:cursor-pointer "
                >
                  {totalHours > 0 ? floatToTime(totalHours) : "-"}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow
            key={"no-task"}
            className="flex  bg-primary border-b-[1px] hover:bg-primary/60"
          >
            <TableCell className=" w-full max-w-sm text-justify font-medium hover:cursor-pointer !px-2 py-4">
              <Typography
                variant="p"
                className="sm:text-sm !font-medium text-destructive"
              >
                No Tasks Found
              </Typography>
            </TableCell>
            {dates.map((date: string, index: number) => {
              const showAdd = index == 0 ? true : false;
              const hour = hours.find((item: any) => item.date === date);
              return (
                <TaskCell
                  onCellClick={!hour.disabled ? onTaskCellClick : () => {}}
                  name=""
                  parent=""
                  task=""
                  description=""
                  hours={0}
                  date={date}
                  isCellDisabled={hour.disabled}
                  showAdd={showAdd}
                />
              );
            })}
            <TableCell
              key={"TotlaHour-empty"}
              className="flex w-full justify-center flex-col font-bold max-w-24 px-0 text-center hover:cursor-pointer "
            >
              -
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </>
  );
}
