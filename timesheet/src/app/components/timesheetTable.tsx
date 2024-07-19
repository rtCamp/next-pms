import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { cn, prettyDate, getDateFromDateAndTime, floatToTime } from "@/lib/utils";
import { Typography } from "./typography";

interface TimesheetTableProps {
  dates: string[];
  holidays: string[];
  tasks: any;
  leaves: string[];
}

export const TimesheetTable = ({ dates, holidays, tasks, leaves }: TimesheetTableProps) => {
  console.log(tasks, leaves);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="max-w-sm w-2/6">
            <Typography variant="p" className="text-base text-slate-600">
              Tasks
            </Typography>
          </TableHead>
          {dates?.map((date: string) => {
            const { date: formattedDate, day } = prettyDate(date);
            const isHoliday = holidays.includes(date);
            return (
              <TableHead key={date} className=" max-w-20">
                <Typography variant="p" className={cn("text-slate-600 font-medium", isHoliday && "text-slate-400")}>
                  {day}
                </Typography>
                <Typography variant="small" className={cn("text-slate-500", isHoliday && "text-slate-300")}>
                  {formattedDate}
                </Typography>
              </TableHead>
            );
          })}
          <TableHead className="max-w-24 w-1/12">
            <Typography variant="p" className="text-base text-slate-600">
              Total
            </Typography>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaves.length > 0 && <LeaveRow dates={dates} leaves={leaves} />}
        {Object.keys(tasks).length > 0 &&
          Object.entries(tasks).map(([task, taskData]: [string, any]) => {
            let totalHours = 0;
            return (
              <TableRow key={task} className="border-b border-slate-200">
                <TableCell>
                  <Typography variant="p" className="text-slate-800">
                    {task}
                  </Typography>
                  <Typography variant="small" className="text-slate-500">
                    {taskData.project_name}
                  </Typography>
                </TableCell>
                {dates.map((date: string) => {
                  const data = taskData.data.find((data: any) => getDateFromDateAndTime(data.from_time) === date);
                  if (data && data.hours) {
                    totalHours += data.hours;
                  }
                  const isHoliday = holidays.includes(date);
                  return (
                    <TableCell key={date}>
                      <Typography variant="p" className={cn("text-slate-600", isHoliday && "text-slate-400")}>
                        {data?.hours ? floatToTime(data?.hours || 0) : "-"}
                      </Typography>
                    </TableCell>
                  );
                })}
                <TableCell>
                  <Typography variant="p" className="text-slate-800 font-medium">
                    {floatToTime(totalHours)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
};

const LeaveRow = ({ leaves, dates }: { leaves: Array<any>; dates: string[] }) => {
  let total_hours = 0;
  return (
    <TableRow>
      <TableCell>
        <Typography variant="p" className="text-slate-800">
          Time Off
        </Typography>
      </TableCell>
      {dates.map((date: string) => {
        const data = leaves.find((data: any) => {
          return date >= data.from_date && date <= data.to_date;
        });
        const hour = data?.half_day ? 4 : 8;
        if (data) {
          total_hours += hour;
        }
        return (
          <TableCell key={date}>
            <Typography variant="p" className="text-slate-600">
              {data ? floatToTime(hour) : "-"}
            </Typography>
          </TableCell>
        );
      })}
      <TableCell>
        <Typography variant="p" className="text-slate-800 font-medium">
          {floatToTime(total_hours)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
