import { getTodayDate,getFormatedDate } from "@/app/lib/utils";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, floatToTime } from "@/app/lib/utils";
import { formatDate } from "@/app/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { useContext, useEffect } from "react";

export default function CompactView() {
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const [WeekDate, setWeekDate] = useState(getTodayDate());
  const [data, setData] = useState<any>(null);
  function fetchData() {
    call
      .post("timesheet_enhancer.api.team.get_weekly_compact_view_data", {
        date: WeekDate,
      })
      .then((res) => {
        setData(res.message);
      });
  }
  const handleprevWeek = () => {
    const date = new Date(WeekDate);
    date.setDate(date.getDate() - 7);
    const stringDate = getFormatedDate(date);
    setWeekDate(stringDate);
  };
  const handlenextWeek = () => {
    const date = new Date(WeekDate);
    date.setDate(date.getDate() + 7);
    const stringDate = getFormatedDate(date);
    setWeekDate(stringDate);
  };
  useEffect(() => {
    fetchData();
  }, [WeekDate]);

  return (
    <div>
      {data && (
        <Table>
          <TableHeader className="[&_tr]:border">
            <TableRow>
              <TableHead className="border-r ">Employee</TableHead>
              <TableHead className="px-0 flex flex-col h-14">
                <div className="flex justify-between">
                  <ChevronLeft
                    className="hover:cursor-pointer"
                    onClick={handleprevWeek}
                  />
                  <p className="px-4 text-center">{data.key} </p>
                  <ChevronRight
                    className="hover:cursor-pointer"
                    onClick={handlenextWeek}
                  />
                </div>
                <div className="border-t flex">
                  {data.dates.map((date: string) => {
                    const { date: formattedDate, day } = formatDate(date);
                    return (
                      <TableHead
                        key={date}
                        className="flex w-full h-8 justify-center flex-col text-center font-bold  px-0 [&:not(:last-child)]:border-r"
                      >
                        <div>{formattedDate}</div>
                      </TableHead>
                    );
                  })}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border">
            {data.data.map((row: any) => {
              return (
                <TableRow key={1}>
                  <TableCell className="border-r w-4/12">
                    {row.employee_name}
                  </TableCell>
                  <TableCell className="p-0">
                    <div className="flex">
                      {data.dates.map((date: string) => {
                        let hours = 0;
                        const isHoliday = row.holidays.includes(date);
                        let isOnLeave = false;
                        const timesheet = row.timesheets.find(
                          (data: any) => data.start_date == date
                        );

                        const leaveData = row.leaves.find((data: any) => {
                          return date >= data.from_date && date <= data.to_date;
                        });
                        if (timesheet) {
                          hours = timesheet.total_hours;
                        } else if (leaveData) {
                          isOnLeave = true;
                          hours = leaveData?.half_day ? 4 : 8;
                        }
                        if (timesheet && leaveData) {
                          isOnLeave = true;
                          const leaveHour =leaveData?.half_day ? 4 : 8
                          hours = timesheet?.total_hours + leaveHour
                        }

                        return (
                          <TableCell
                            className={cn(
                              "flex w-full flex-col text-center  px-0  [&:not(:last-child)]:border-r",
                              `${
                                isHoliday
                                  ? "text-muted-foreground bg-muted hover:cursor-not-allowed "
                                  : isOnLeave
                                  ? "text-muted-foreground bg-muted hover:cursor-not-allowed "
                                  : "hover:cursor-pointer"
                              } `
                            )}
                          >
                            {!isHoliday ? floatToTime(hours) : ""}
                          </TableCell>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
