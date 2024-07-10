import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, cn, getTodayDate } from "@/app/lib/utils";
import { TaskCellClickProps } from "@/app/types/timesheet";
import { TimesheetTableBody } from "./TableBody";

interface TimesheetTableProps {
  data: any;
  onTaskCellClick: ({
    date,
    name,
    parent,
    task,
    description,
    hours,
    employee,
  }: TaskCellClickProps) => void;
  isHeading?: boolean;
  employee?: string;
}
interface HourProps {
  date: string;
  hours: number;
}
export function TimesheetTable({
  data,
  onTaskCellClick,
  isHeading = true,
  employee = "",
}: TimesheetTableProps) {
  const dates = data?.dates;
  const hours = data?.hours;
  const holidays = data?.holidays;
  const tasks = data?.tasks;
  const leaves = data?.leaves;
  return (
    <div className="max-w-full box-border overflow-x-hidden ">
      <Table className="[&_th]:px-0 [&_td]:px-0  box-border overflow-x-auto no-scrollbar">
        {isHeading && (
          <TableHeader>
            <TableRow className="flex h-16 ">
              <TableHead
                key="Heading"
                className="flex w-96  font-medium items-center h-16  !px-2  text-primary"
              >
                Tasks
              </TableHead>
              {dates.map((date: string) => {
                const { date: formattedDate, day } = formatDate(date);
                const val = hours.find((item: HourProps) => item.date === date);
                
                const isHoliday = holidays.includes(date);
                const leaveData = leaves.find((data: any) => {
                  return date >= data.from_date && date <= data.to_date;
                });
                let dayTotal = val.hours;
                if (leaveData) {
                  if (
                    leaveData.half_day ||
                    (leaveData.half_day_date && leaveData.half_day_date == date)
                  ) {
                    dayTotal += 4;
                  } else {
                    dayTotal += 8;
                  }
                }
                let classname = "";
                if (dayTotal < 8) {
                  classname = "bg-destructive";
                } else if (dayTotal == 8) {
                  classname = "bg-success";
                } else {
                  classname = "bg-warning";
                }
                if (date >= getTodayDate() || isHoliday) {
                  classname = "";
                }
                return (
                  <div className="flex w-20  h-16    flex-col max-w-20  px-0 ">
                    <TableHead
                      key={date}
                      className={cn("h-full flex flex-col justify-center text-primary",isHoliday && "text-muted-foreground/50")}
                    >
                      <div className={cn(`font-semibold `)}>{day}</div>
                      <div className={cn(` text-xs font-medium `)}>
                        {formattedDate.toUpperCase()}
                      </div>
                    </TableHead>

                    <span className={cn(`w-6/12 h-[3px] ${classname}`)}></span>
                  </div>
                );
              })}
              <TableHead
                key="Total"
                className="flex w-24  justify-center flex-col h-16  text-heading text-center max-w-24 font-bold  px-0"
              >
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
        )}
        <TimesheetTableBody
          tasks={tasks}
          heading={isHeading}
          holidays={holidays}
          dates={dates}
          leaves={leaves}
          hours={hours}
          employee={employee}
          onTaskCellClick={onTaskCellClick}
        />
      </Table>
    </div>
  );
}
