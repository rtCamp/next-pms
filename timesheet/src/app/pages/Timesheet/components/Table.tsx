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
  }: TaskCellClickProps) => void;
  onApproveTimeClick?: (tableRef: any) => void;
}
interface HourProps {
  date: string;
  hours: number;
}
export function TimesheetTable({
  data,
  onTaskCellClick,
  onApproveTimeClick,
}: TimesheetTableProps) {
  const dates = data?.dates;
  const hours = data?.hours;
  const holidays = data?.holidays;
  const tasks = data?.tasks;
  const leaves = data?.leaves;

  return (
    <Table className="[&_th]:px-0 [&_td]:px-0 ">
      <TableHeader>
        <TableRow className="flex h-16">
          <TableHead
            key="Heading"
            className="flex w-full max-w-96 font-medium items-center h-16 text-heading "
          >
            Tasks
          </TableHead>
          {dates.map((date: string) => {
            const { date: formattedDate, day } = formatDate(date);
            const val = hours.find((item: HourProps) => item.date === date);
            const isToday = getTodayDate() == date;
            const isHoliday = holidays.includes(date);

            let classname = "";
            if (val.hours < 8) {
              classname = "bg-error";
            } else if (val.hours == 8) {
              classname = "bg-success";
            } else {
              classname = "bg-warning";
            }
            if (date >= getTodayDate() || isHoliday) {
              classname = "";
            }
            return (
              <div className="flex w-full  h-16  text-[#09090B]  flex-col  max-w-[90px]  px-0 ">
                <TableHead
                  key={date}
                  className="h-full flex flex-col justify-center"
                >
                  <div
                    className={cn(
                      `font-semibold ${
                        getTodayDate() < date || isHoliday
                          ? "text-secondaryText"
                          : isToday
                          ? "text-gradientPrimary"
                          : "text-heading"
                      }`
                    )}
                  >
                    {day}
                  </div>
                  <div
                    className={cn(
                      ` ${
                        isToday ? "text-gradientPrimary" : "text-secondaryText"
                      } text-xs font-medium `
                    )}
                  >
                    {formattedDate.toUpperCase()}
                  </div>
                </TableHead>

                <span className={cn(`w-6/12 h-1 ${classname}`)}></span>
              </div>
            );
          })}
          <TableHead
            key="Total"
            className="flex w-full  justify-center flex-col h-16  text-heading text-center max-w-24 font-bold  px-0"
          >
            Total
          </TableHead>
        </TableRow>
      </TableHeader>
      <TimesheetTableBody
        tasks={tasks}
        holidays={holidays}
        dates={dates}
        leaves={leaves}
        onTaskCellClick={onTaskCellClick}
      />
    </Table>
  );
}
