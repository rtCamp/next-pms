import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getTodayDate, formatDate } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { useContext, useEffect, useReducer, useState } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { TimesheetTable } from "@/app/pages/Timesheet/TimesheetTable";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";

import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg, floatToTime, cn } from "@/app/lib/utils";

import { getInitialState, reducer } from "@/app/reducer/timesheet";

interface TeamViewProps {
  summary: {
    start_date: string;
    end_date: string;
    key: string;
    dates: string[];
    data: rowProps[];
  };
  data: object;
}
interface rowProps {
  name: string;
  image: string;
  employee_name: string;
  holidays: string[];
  timesheets: object[];
  leaves: object[];
}
export default function TeamView() {
  const initValue = {
    summary: {
      start_date: "",
      end_date: "",
      key: "",
      dates: [],
      data: [],
    },
    data: {},
  };

  const { toast } = useToast();
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const [WeekDate, setWeekDate] = useState(getTodayDate());
  const [data, setData] = useState<TeamViewProps>(initValue);
  const [state, dispatch] = useReducer(reducer, getInitialState);

  function fetchData() {
    call
      .post("timesheet_enhancer.api.team.get_weekly_team_view_data", {
        date: WeekDate,
      })
      .then((res) => {
        setData(res.message);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err._server_messages);
        dispatch({ type: "SetFetching", payload: false });
        toast({
          variant: "destructive",
          title: "Error! Something went wrong.",
          description: error.message ?? error,
        });
      });
  }
  useEffect(() => {
    fetchData();
  }, [WeekDate]);

  const summary = data?.summary;
  const dates = data?.summary?.dates;

  return (
    <>
      <Card>
        <CardHeader className="space-y-0 p-0">
          <tr className="flex">
            <td className="w-full max-w-96 border-b text-center">Members</td>
            {dates &&
              dates.map((date: string) => {
                const { date: formattedDate, day } = formatDate(date);
                return (
                  <td
                    key={date}
                    className="flex w-full  justify-center flex-col text-center max-w-20   px-0 hover:cursor-pointer border-l border-b"
                  >
                    <div className="font-medium">{day}</div>
                    <div className="text-sm">{formattedDate}</div>
                  </td>
                );
              })}
            <td
              key="t"
              className="flex w-full  justify-center flex-col text-center max-w-20 font-medium  px-0 hover:cursor-pointer border-l border-b"
            >
              Total
            </td>
          </tr>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {summary &&
              summary.data.map((row: rowProps) => {
                let total = 0;
                let result = Object.entries(data.data).find(
                  ([key, value]) => key === row.name
                );
                result = result ? result[1] : {};
                return (
                  <AccordionItem key={row.name} value={row.name}>
                    <AccordionTrigger className="bg-background hover:no-underline focus:outline-none hover:border-transparent focus:outline-offset-0 focus:outline-0 p-0 font-normal">
                      <tr className="flex w-full">
                        <td className=" flex w-full max-w-96  p-2 text-center items-center gap-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={row.image} alt="User Image" />
                            <AvatarFallback>
                              {row.employee_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {row.employee_name}
                        </td>
                        {dates.map((date: string) => {
                          let hours = 0;

                          const isHoliday = row.holidays.includes(date);
                          let isOnLeave = false;
                          const timesheet: any = row.timesheets.find(
                            (data: any) => data.start_date == date
                          );

                          const leaveData: any = row.leaves.find(
                            (data: any) => {
                              return (
                                date >= data.from_date && date <= data.to_date
                              );
                            }
                          );
                          if (timesheet) {
                            hours = timesheet.total_hours;
                          } else if (leaveData) {
                            isOnLeave = true;
                            hours = leaveData?.half_day ? 4 : 8;
                          }
                          if (timesheet && leaveData) {
                            isOnLeave = true;
                            const leaveHour = leaveData?.half_day ? 4 : 8;
                            hours = timesheet?.total_hours + leaveHour;
                          }
                          total += hours;
                          return (
                            <td
                              className={cn(
                                "flex w-full  justify-center flex-col text-center max-w-20 px-0 border-l",
                                `${
                                  isHoliday
                                    ? "text-muted-foreground bg-muted hover:cursor-not-allowed "
                                    : isOnLeave
                                    ? "text-muted-foreground bg-muted hover:cursor-not-allowed "
                                    : "hover:cursor-pointer"
                                } `
                              )}
                            >
                              {!isHoliday && hours ? floatToTime(hours) : "-"}
                            </td>
                          );
                        })}
                        <td
                          key="t"
                          className="flex w-full  justify-center flex-col text-center max-w-20 px-0 border-l"
                        >
                          {floatToTime(total)}
                        </td>
                      </tr>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <TimesheetTable
                        data={result}
                        isHeading={false}
                        onTaskCellClick={() => {}}
                        onApproveTimeClick={() => {}}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
