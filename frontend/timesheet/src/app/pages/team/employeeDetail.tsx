import { Button } from "@/app/components/ui/button";
import { useParams } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import {
  cn,
  getDateFromDateAndTime,
  getFormatedDate,
  getTodayDate,
  parseFrappeErrorMsg,
  prettyDate,
  calculateExtendedWorkingHour,
  deBounce,
  floatToTime,
  preProcessLink,
  expectatedHours,
  getDateTimeForMultipleTimeZoneSupport,
} from "@/lib/utils";
import { useEffect, useLayoutEffect, useState } from "react";
import { useToast } from "@/app/components/ui/use-toast";
import { Spinner } from "@/app/components/spinner";
import { Typography } from "@/app/components/typography";
import TimesheetTable from "@/app/components/timesheetTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { CircleDollarSign } from "lucide-react";
import { addDays } from "date-fns";
import AddTime from "@/app/components/addTime";
import {
  setTimesheet,
  setFetchAgain,
  setTimesheetData,
  updateTimesheetData,
  setEmployeeWeekDate,
  resetTimesheetDataState,
  setEmployee,
  setDialog,
  setEditDialog,
  setDateRange,
} from "@/store/team";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Status } from "@/app/pages/team";
import { LeaveProps, NewTimesheetProps, TaskDataItemProps, TaskDataProps, timesheet } from "@/types/timesheet";
import { useNavigate } from "react-router-dom";
import { Input } from "@/app/components/ui/input";
import { timeFormatRegex } from "@/schema/timesheet";
import { EditTime } from "@/app/pages/timesheet/editTime";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { Approval } from "./approval";
const EmployeeDetail = () => {
  const { id } = useParams();
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!id) {
      const EMPLOYEE_ID_NOT_FOUND = "Please pick an employee from the combo box.";
      toast({
        variant: "destructive",
        description: EMPLOYEE_ID_NOT_FOUND,
      });
    }
  }, [id]);

  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "frappe_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: id,
      start_date: teamState.employeeWeekDate,
      max_week: 4,
    },
    undefined,
    {
      errorRetryCount: 1,
    },
  );

  const handleAddTime = () => {
    const timesheet = {
      name: "",
      task: "",
      date: getFormatedDate(getDateTimeForMultipleTimeZoneSupport()),
      description: "",
      hours: 0,
      isUpdate: false,
    };
    dispatch(setTimesheet({ timesheet, id }));
    dispatch(setDialog(true));
  };
  const handleLoadData = () => {
    if (teamState.timesheetData.data == undefined || Object.keys(teamState.timesheetData.data).length == 0) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const obj = teamState.timesheetData.data[Object.keys(teamState.timesheetData.data).pop()];
    const date = getFormatedDate(addDays(obj.start_date, -1));
    dispatch(setEmployeeWeekDate(date));
  };
  useEffect(() => {
    dispatch(resetTimesheetDataState());
    const date = getTodayDate();
    dispatch(setEmployeeWeekDate(date));
    dispatch(setEmployee(id as string));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (teamState.isFetchAgain) {
      mutate();
      dispatch(setFetchAgain(false));
    }
    if (data) {
      if (teamState.timesheetData.data && Object.keys(teamState.timesheetData.data).length > 0) {
        dispatch(updateTimesheetData(data.message));
      } else {
        dispatch(setTimesheetData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, teamState.employeeWeekDate, error, teamState.isFetchAgain]);
  const onEmployeeChange = (name: string) => {
    navigate(`/team/employee/${name}`);
  };
  return (
    <>
      {teamState.isAprrovalDialogOpen && <Approval />}
      {teamState.isDialogOpen && (
        <AddTime
          open={teamState.isDialogOpen}
          onOpenChange={() => {
            dispatch(setDialog(false));
          }}
          onSuccess={() => {
            dispatch(setFetchAgain(true));
          }}
          task={teamState.timesheet.task}
          initialDate={teamState.timesheet.date}
          employee={teamState.employee}
          workingFrequency={teamState.timesheetData.working_frequency}
          workingHours={teamState.timesheetData.working_hour}
          project={teamState.timesheet.project}
        />
      )}
      {teamState.isEditDialogOpen && (
        <EditTime
          open={teamState.isEditDialogOpen}
          employee={teamState.employee}
          date={teamState.timesheet.date}
          task={teamState.timesheet.task}
          onClose={() => {
            dispatch(setEditDialog(false));
            dispatch(setFetchAgain(true));
          }}
        />
      )}
      <EmployeeCombo onSelect={onEmployeeChange} value={id as string} className="lg:max-w-xs max-md:w-full" />
      <Tabs defaultValue="timesheet" className="mt-3">
        <div className="flex gap-x-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
          </TabsList>
          <Button className="float-right mb-1" onClick={handleAddTime}>
            Add Time
          </Button>
        </div>
        {isLoading ? (
          <Spinner isFull />
        ) : (
          <>
            <div className="overflow-y-auto" style={{ height: "calc(100vh - 11rem)" }}>
              <TabsContent value="timesheet" className="mt-0">
                <Timesheet />
              </TabsContent>
              <TabsContent value="time" className="mt-0">
                <Time
                  callback={() => {
                    dispatch(setFetchAgain(true));
                  }}
                />
              </TabsContent>
            </div>
            <div className="mt-5">
              <Button className="float-left" variant="outline" onClick={handleLoadData}>
                Load More
              </Button>
            </div>
          </>
        )}
      </Tabs>
    </>
  );
};

const Timesheet = () => {
  const { id } = useParams();
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();

  const onCellClick = (timesheet: NewTimesheetProps) => {
    dispatch(setTimesheet({ timesheet, id }));
    if (timesheet.hours > 0) {
      dispatch(setEditDialog(true));
    } else {
      dispatch(setDialog(true));
    }
  };

  const handleStatusClick = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch(setDateRange({ dateRange: data, employee: teamState.employee, isAprrovalDialogOpen: true }));
  };
  const working_hour = expectatedHours(teamState.timesheetData.working_hour, teamState.timesheetData.working_frequency);
  return (
    <div className="flex flex-col">
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet], index: number) => {
          let total_hours = value.total_hours;
          value.dates.map((date) => {
            let isHoliday = false;
            const leaveData = teamState.timesheetData.leaves.filter((data: LeaveProps) => {
              return date >= data.from_date && date <= data.to_date;
            });
            const holiday = teamState.timesheetData.holidays.find((holiday) => holiday.holiday_date === date);

            if (holiday) {
              isHoliday = true;
              if (!holiday.weekly_off) {
                total_hours += working_hour;
              }
            }

            if (leaveData.length > 0 && !isHoliday) {
              leaveData.forEach((data: LeaveProps) => {
                const isHalfDayLeave = data.half_day && data.half_day_date == date;
                if (isHalfDayLeave) {
                  total_hours += working_hour / 2;
                } else {
                  total_hours += working_hour;
                }
              });
            }
          });
          return (
            <>
              <Accordion type="multiple" key={key} defaultValue={index === 0 || index === 1 ? [key] : undefined}>
                <AccordionItem value={key}>
                  <AccordionTrigger className="hover:no-underline w-full">
                    <div className="flex justify-between items-center w-full pr-2">
                      <Typography variant="h6" className="font-normal">
                        {key}: {floatToTime(total_hours)}h
                      </Typography>
                      <Button
                        variant="ghost"
                        className="p-1 h-fit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusClick(value.start_date, value.end_date);
                        }}
                      >
                        <Status status={value.status} />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <TimesheetTable
                      dates={value.dates}
                      holidays={teamState.timesheetData.holidays}
                      leaves={teamState.timesheetData.leaves}
                      tasks={value.tasks}
                      onCellClick={onCellClick}
                      working_frequency={teamState.timesheetData.working_frequency}
                      working_hour={teamState.timesheetData.working_hour}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          );
        })}
    </div>
  );
};

export const Time = ({ callback }: { callback?: () => void }) => {
  const teamState = useSelector((state: RootState) => state.team);
  const { call } = useFrappePostCall("frappe_pms.timesheet.api.timesheet.save");
  const { toast } = useToast();
  const dispatch = useDispatch();
  const updateTime = (value: NewTimesheetProps) => {
    call(value)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        callback && callback();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  const handleStatusClick = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch(setDateRange({ dateRange: data, employee: teamState.employee, isAprrovalDialogOpen: true }));
  };
  const holidays = teamState.timesheetData.holidays.map((holiday) => {
    if (typeof holiday === "object" && "holiday_date" in holiday) {
      return holiday.holiday_date;
    } else {
      return holiday;
    }
  });
  const working_hour = expectatedHours(teamState.timesheetData.working_hour, teamState.timesheetData.working_frequency);
  return (
    <div>
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet], index: number) => {
          let total_hours = value.total_hours;

          value.dates.map((date) => {
            const leaveData = teamState.timesheetData.leaves.filter((data: LeaveProps) => {
              return date >= data.from_date && date <= data.to_date;
            });
            const isHoliday = holidays.includes(date);
            if (leaveData.length > 0 && !isHoliday) {
              leaveData.forEach((data: LeaveProps) => {
                const isHalfDayLeave = data.half_day && data.half_day_date == date;
                if (isHalfDayLeave) {
                  total_hours += working_hour / 2;
                } else {
                  total_hours += working_hour;
                }
              });
            }
          });
          return (
            <>
              <Accordion type="multiple" key={key} defaultValue={index === 0 || index === 1 ? [key] : undefined}>
                <AccordionItem value={key}>
                  <AccordionTrigger className="hover:no-underline w-full">
                    <div className="flex justify-between w-full pr-2">
                      <Typography variant="h6" className="font-normal">
                        {key}: {floatToTime(total_hours)}h
                      </Typography>
                      <Button
                        variant="ghost"
                        className="p-1 h-fit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusClick(value.start_date, value.end_date);
                        }}
                      >
                        <Status status={value.status} />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {value.dates.map((date: string, index: number) => {
                      const { date: formattedDate } = prettyDate(date, true);
                      const matchingTasks = Object.entries(value.tasks).flatMap(([, task]: [string, TaskDataProps]) =>
                        task.data
                          .filter((taskItem: TaskDataItemProps) => getDateFromDateAndTime(taskItem.from_time) === date)
                          .map((taskItem: TaskDataItemProps) => ({
                            ...taskItem,
                            subject: task.subject,
                            project_name: task.project_name,
                          })),
                      );
                      const holiday = teamState.timesheetData.holidays.find(
                        (holiday) => typeof holiday !== "string" && holiday.holiday_date === date,
                      );
                      const isHoliday = !!holiday;
                      let totalHours = matchingTasks.reduce((sum, task) => sum + task.hours, 0);
                      const leave = teamState.timesheetData.leaves.filter((data: LeaveProps) => {
                        return date >= data.from_date && date <= data.to_date;
                      });

                      let isHalfDayLeave = false;
                      if (leave.length > 0 && !isHoliday) {
                        leave.forEach((data: LeaveProps) => {
                          isHalfDayLeave = data.half_day && data.half_day_date == date;
                          if (isHalfDayLeave) {
                            totalHours += working_hour / 2;
                          } else {
                            totalHours += working_hour;
                          }
                        });
                      }
                      const isExtended = calculateExtendedWorkingHour(
                        totalHours,
                        teamState.timesheetData.working_hour,
                        teamState.timesheetData.working_frequency,
                      );
                      return (
                        <div key={index} className="flex flex-col">
                          <div className="bg-gray-100 p-1 pl-2.5 rounded border-b flex items-center gap-x-2">
                            <Typography
                              variant="p"
                              className={cn(
                                isExtended == 0 && "text-destructive",
                                isExtended && "text-success",
                                isExtended == 2 && "text-warning",
                              )}
                            >
                              {floatToTime(totalHours)}h
                            </Typography>
                            <Typography variant="p">{formattedDate}</Typography>
                            {isHoliday && (
                              <Typography variant="p" className="text-gray-600">
                                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                {/* @ts-ignore */}
                                {holiday.description}
                              </Typography>
                            )}
                            {leave.length > 0 && !isHoliday && (
                              <Typography variant="p" className="text-gray-600">
                                ({isHalfDayLeave && totalHours != working_hour ? "Half day leave" : "Full Day Leave"})
                              </Typography>
                            )}
                          </div>
                          {matchingTasks?.map((task: TaskDataItemProps, index: number) => {
                            const data = {
                              name: task.name,
                              parent: task.parent,
                              task: task.task,
                              employee: teamState.employee,
                              date: getDateFromDateAndTime(task.from_time),
                              description: task.description,
                              hours: task.hours,
                              is_billable: task.is_billable,
                            };
                            return (
                              <div className="flex gap-x-4 p-2 border-b last:border-b-0" key={index}>
                                <TimeInput
                                  disabled={task.docstatus == 1}
                                  data={data}
                                  callback={updateTime}
                                  employee={teamState.employee}
                                  className="w-12 p-1 h-8"
                                />
                                <div className="grid w-full grid-cols-3">
                                  <div className="flex gap-1">
                                    <div
                                      title={task.is_billable == 1 ? "Billable task" : ""}
                                      className={cn(
                                        task.is_billable && "cursor-pointer",
                                        "w-6 h-full flex justify-center flex-none",
                                      )}
                                    >
                                      {task.is_billable == 1 && (
                                        <CircleDollarSign className="w-4 h-5 ml-1 stroke-success" />
                                      )}
                                    </div>
                                    <div className="flex flex-col max-w-xs">
                                      <Typography variant="p" className="truncate">
                                        {task.subject}
                                      </Typography>
                                      <Typography variant="small" className="truncate text-slate-500">
                                        {task.project_name}
                                      </Typography>
                                    </div>
                                  </div>

                                  <p
                                    dangerouslySetInnerHTML={{ __html: preProcessLink(task.description ?? "") }}
                                    className="text-sm font-normal col-span-2"
                                  ></p>
                                </div>
                              </div>
                            );
                          })}
                          {matchingTasks.length == 0 && (
                            <Typography variant="p" className="text-center p-3 text-gray-400">
                              No data.
                            </Typography>
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          );
        })}
    </div>
  );
};

export const TimeInput = ({
  data,
  employee,
  disabled = false,
  className,
  callback,
}: {
  data: NewTimesheetProps;
  employee: string;
  className?: string;
  disabled?: boolean;
  callback: (data: NewTimesheetProps) => void;
}) => {
  const [hour, setHour] = useState(floatToTime(data.hours));
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let time = 0;
    const hour = e.target.value;
    setHour(hour);

    if (timeFormatRegex.test(hour)) {
      const [hours, minutes] = hour.split(":").map(Number);
      time = hours + minutes / 60;
    } else {
      time = parseFloat(hour);
    }
    if (time == 0 || Number.isNaN(time)) return;
    timeUpdate(time);
  };
  const timeUpdate = deBounce((hour: number) => {
    const value = {
      ...data,
      hours: hour,
      employee: employee,
    };
    callback(value);
  }, 1500);
  return <Input value={hour} className={cn("w-20", className)} onChange={handleHourChange} disabled={disabled} />;
};
export default EmployeeDetail;
