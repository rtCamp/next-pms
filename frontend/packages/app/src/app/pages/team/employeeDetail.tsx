/**
 * External dependencies.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Spinner,
  Button,
  Input,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  Typography,
} from "@next-pms/design-system/components";
import {
  getFormatedDate,
  getTodayDate,
  prettyDate,
  getUTCDateTime,
  normalizeDate,
  getDateFromDateAndTimeString,
} from "@next-pms/design-system/date";
import { cn, floatToTime, preProcessLink } from "@next-pms/design-system/utils";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Calendar, CircleDollarSign, Paperclip, Plus } from "lucide-react";
/**
 * Internal dependencies.
 */
import AddTime from "@/app/components/AddTime";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { TimesheetTable } from "@/app/components/timesheet-table";
import { Header, Main } from "@/app/layout/root";
import { TaskLog } from "@/app/pages/task/taskLog";
import { Status } from "@/app/pages/team";
import { EditTime } from "@/app/pages/timesheet/editTime";
import { parseFrappeErrorMsg, calculateExtendedWorkingHour, expectatedHours, copyToClipboard } from "@/lib/utils";
import { timeStringToFloat } from "@/schema/timesheet";
import { RootState } from "@/store";
import {
  setTimesheet,
  setTimesheetData,
  updateTimesheetData,
  setEmployeeWeekDate,
  resetTimesheetDataState,
  setEmployee,
  setDialog,
  setEditDialog,
  setDateRange,
} from "@/store/team";
import { LeaveProps, NewTimesheetProps, TaskDataItemProps, TaskDataProps, timesheet } from "@/types/timesheet";
import { Approval } from "./approval";
import { InfiniteScroll } from "../resource_management/components/InfiniteScroll";
import ExpandableHours from "../timesheet/expandableHours";

const isDateInRange = (date: string, startDate: string, endDate: string) => {
  const targetDate = getUTCDateTime(normalizeDate(date));

  return getUTCDateTime(startDate) <= targetDate && targetDate <= getUTCDateTime(endDate);
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const teamState = useSelector((state: RootState) => state.team);
  const [startDateParam, setstartDateParam] = useQueryParam<string>("date", "");
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const validateDate = () => {
    if (!startDateParam) {
      return true;
    }
    const date = getFormatedDate(normalizeDate(startDateParam));
    const timesheetData = teamState.timesheetData.data;
    if (timesheetData && Object.keys(timesheetData).length > 0) {
      const keys = Object.keys(timesheetData);
      const firstObject = timesheetData[keys[0]];
      const lastObject = timesheetData[keys[keys.length - 1]];
      if (isDateInRange(date, lastObject.start_date, firstObject.end_date)) {
        return true;
      }
    }

    return false;
  };
  useLayoutEffect(() => {
    if (!id) {
      const EMPLOYEE_ID_NOT_FOUND = "Please pick an employee from the combo box.";
      toast({
        variant: "destructive",
        description: EMPLOYEE_ID_NOT_FOUND,
      });
    }
  }, [id]);

  const { data, isLoading, error, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: id,
    start_date: teamState.employeeWeekDate,
    max_week: 4,
  });

  const handleAddTime = () => {
    const timesheet = {
      name: "",
      task: "",
      date: getFormatedDate(getUTCDateTime()),
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
    setstartDateParam("");
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
  }, [data, error]);

  useEffect(() => {
    if (Object.keys(teamState.timesheetData.data).length == 0) return;
    if (!validateDate()) {
      const obj = teamState.timesheetData.data;
      const info = obj[Object.keys(obj).pop()];
      const date = getFormatedDate(addDays(info.start_date, -1));
      dispatch(setEmployeeWeekDate(date));
    }
  }, [startDateParam, teamState.timesheetData.data]);

  const onEmployeeChange = (name: string) => {
    navigate(`/team/employee/${name}`);
  };
  const { data: employee } = useFrappeGetCall("next_pms.timesheet.api.employee.get_employee", {
    filters: { name: id },
  });

  return (
    <>
      {teamState.isAprrovalDialogOpen && <Approval onClose={mutate} />}
      {teamState.isDialogOpen && (
        <AddTime
          open={teamState.isDialogOpen}
          onOpenChange={() => {
            mutate();
            dispatch(setDialog(false));
          }}
          onSuccess={mutate}
          task={teamState.timesheet.task}
          initialDate={teamState.timesheet.date}
          employee={teamState.employee}
          workingFrequency={teamState.timesheetData.working_frequency}
          workingHours={teamState.timesheetData.working_hour}
          project={teamState.timesheet.project}
          employeeName={employee?.message?.employee_name}
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
            mutate();
          }}
        />
      )}
      <Header>
        <EmployeeCombo
          employeeName={employee?.message?.employee_name}
          onSelect={onEmployeeChange}
          pageLength={20}
          value={id as string}
          className="w-full lg:w-fit"
          ignoreDefaultFilters={true}
        />
      </Header>
      <div className="w-full h-full overflow-x-auto">
        <InfiniteScroll isLoading={isLoading} hasMore={true} verticalLodMore={handleLoadData}>
          <Main>
            <Tabs defaultValue="timesheet" className="relative">
              <div className="flex gap-x-4 pt-3 px-0 sticky top-0 z-10 transition-shadow duration-300 backdrop-blur-sm bg-background">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
                  <TabsTrigger value="time">Time</TabsTrigger>
                </TabsList>
                <Button title="Add Time" className="float-right mb-1 px-3" onClick={handleAddTime}>
                  <Plus /> Time
                </Button>
              </div>
              {isLoading && Object.keys(teamState.timesheetData.data).length == 0 ? (
                <Spinner isFull />
              ) : (
                <>
                  <TabsContent value="timesheet" className="mt-0">
                    <Timesheet startDateParam={startDateParam} setStartDateParam={setstartDateParam} />
                  </TabsContent>
                  <TabsContent value="time" className="mt-0">
                    <Time callback={mutate} startDateParam={startDateParam} setStartDateParam={setstartDateParam} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </Main>
        </InfiniteScroll>
      </div>
    </>
  );
};

const Timesheet = ({
  startDateParam,
  setStartDateParam,
}: {
  startDateParam: string;
  setStartDateParam: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { id } = useParams();
  const targetRef = useRef(null);
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();

  const { call: fetchLikedTask, loading: loadingLikedTasks } = useFrappePostCall(
    "next_pms.timesheet.api.task.get_liked_tasks"
  );
  const [likedTaskData, setLikedTaskData] = useState([]);

  const getLikedTaskData = () => {
    fetchLikedTask({}).then((res) => {
      setLikedTaskData(res.message ?? []);
    });
  };

  useEffect(() => {
    getLikedTaskData();
  }, []);

  const onCellClick = (timesheet: NewTimesheetProps) => {
    dispatch(setTimesheet({ timesheet, id }));
    if (timesheet.hours > 0) {
      dispatch(setEditDialog(true));
    } else {
      dispatch(setDialog(true));
    }
  };

  useEffect(() => {
    const scrollToElement = () => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };

    const observer = new MutationObserver(scrollToElement);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const handleStatusClick = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch(setDateRange({ dateRange: data, isAprrovalDialogOpen: true }));
  };
  const working_hour = expectatedHours(teamState.timesheetData.working_hour, teamState.timesheetData.working_frequency);
  return (
    <div className="flex flex-col">
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet], index: number) => {
          let total_hours = value.total_hours;
          let timeoff_hours = 0;
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
                  timeoff_hours += working_hour / 2;
                } else {
                  total_hours += working_hour;
                  timeoff_hours += working_hour;
                }
              });
            }
          });
          return (
            <Accordion type="multiple" key={key} defaultValue={Object.keys(teamState.timesheetData.data)}>
              <AccordionItem value={key}>
                <AccordionTrigger className="hover:no-underline w-full max-md:[&>svg]:hidden">
                  <div className="flex justify-between items-center w-full pr-2 group">
                    <div className="font-normal text-xs sm:text-base flex items-center gap-x-2 max-md:gap-x-3 sm:flex-row overflow-x-auto no-scrollbar max-md:w-4/5">
                      <span className="flex items-center gap-2 shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <h2 className="font-medium">{key}</h2>
                      </span>
                      <Separator orientation="vertical" className="block h-5 shrink-0" />
                      <ExpandableHours
                        totalHours={floatToTime(total_hours)}
                        workingHours={floatToTime(total_hours - timeoff_hours)}
                        timeoffHours={floatToTime(timeoff_hours)}
                      />
                      <Paperclip
                        className="w-3 h-3 hidden group-hover:block shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartDateParam(value.start_date);
                          copyToClipboard(
                            `${window.location.origin}${window.location.pathname}?date="${value.start_date}"`
                          );
                        }}
                      />
                    </div>
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
                <AccordionContent
                  className="pb-0"
                  ref={
                    !isEmpty(startDateParam) && isDateInRange(startDateParam, value.start_date, value.end_date)
                      ? targetRef
                      : null
                  }
                >
                  <TimesheetTable
                    dates={value.dates}
                    holidays={teamState.timesheetData.holidays}
                    leaves={teamState.timesheetData.leaves}
                    tasks={value.tasks}
                    onCellClick={onCellClick}
                    disabled={value.status === "Approved"}
                    workingFrequency={teamState.timesheetData.working_frequency}
                    workingHour={teamState.timesheetData.working_hour}
                    loadingLikedTasks={loadingLikedTasks}
                    likedTaskData={likedTaskData}
                    getLikedTaskData={getLikedTaskData}
                    hideLikeButton={true}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
    </div>
  );
};

export const Time = ({
  callback,
  startDateParam,
  setStartDateParam,
}: {
  callback?: () => void;
  startDateParam: string;
  setStartDateParam: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const targetRef = useRef(null);
  const teamState = useSelector((state: RootState) => state.team);
  const { call } = useFrappePostCall("next_pms.timesheet.api.timesheet.update_timesheet_detail");
  const { toast } = useToast();
  const dispatch = useDispatch();
  const updateTime = (value: NewTimesheetProps) => {
    call(value)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        callback?.();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  useEffect(() => {
    const scrollToElement = () => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };

    const observer = new MutationObserver(scrollToElement);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  const handleStatusClick = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch(setDateRange({ dateRange: data, isAprrovalDialogOpen: true }));
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
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet], index: number) => {
          let total_hours = value.total_hours;
          let timeoff_hours = 0;
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
                  timeoff_hours += working_hour / 2;
                } else {
                  total_hours += working_hour;
                  timeoff_hours += working_hour;
                }
              });
            }
          });
          return (
            <Accordion type="multiple" key={key} defaultValue={Object.keys(teamState.timesheetData.data)}>
              <AccordionItem value={key}>
                <AccordionTrigger className="hover:no-underline w-full max-md:[&>svg]:hidden">
                  <div className="flex justify-between w-full pr-2 group">
                    <div className="font-normal text-xs sm:text-base flex items-center gap-x-2 max-md:gap-x-3 sm:flex-row overflow-x-auto no-scrollbar max-md:w-4/5">
                      <span className="flex items-center gap-2 shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <h2 className="font-medium">{key}</h2>
                      </span>
                      <Separator orientation="vertical" className="block h-5 shrink-0" />
                      <ExpandableHours
                        totalHours={floatToTime(total_hours)}
                        workingHours={floatToTime(total_hours - timeoff_hours)}
                        timeoffHours={floatToTime(timeoff_hours)}
                      />
                      <Paperclip
                        className="w-3 h-3 hidden group-hover:block shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartDateParam(value.start_date);
                          copyToClipboard(
                            `${window.location.origin}${window.location.pathname}?date="${value.start_date}"`
                          );
                        }}
                      />
                    </div>
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
                <AccordionContent
                  className="pb-0"
                  ref={
                    !isEmpty(startDateParam) && isDateInRange(startDateParam, value.start_date, value.end_date)
                      ? targetRef
                      : null
                  }
                >
                  {value.dates.map((date: string, index: number) => {
                    const { date: formattedDate } = prettyDate(date, true);
                    const matchingTasks = Object.entries(value.tasks).flatMap(([, task]: [string, TaskDataProps]) =>
                      task.data
                        .filter(
                          (taskItem: TaskDataItemProps) => getDateFromDateAndTimeString(taskItem.from_time) === date
                        )
                        .map((taskItem: TaskDataItemProps) => ({
                          ...taskItem,
                          subject: task.subject,
                          project_name: task.project_name,
                        }))
                    );
                    const holiday = teamState.timesheetData.holidays.find(
                      (holiday) => typeof holiday !== "string" && holiday.holiday_date === date
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
                      teamState.timesheetData.working_frequency
                    );
                    return (
                      <div key={index} className="flex flex-col">
                        <div className="bg-gray-100 p-1 pl-2.5 rounded border-b flex items-center gap-x-2">
                          <Typography
                            variant="p"
                            className={cn(
                              isExtended == 0 && "text-destructive",
                              isExtended && "text-success",
                              isExtended == 2 && "text-warning"
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
                            date: getDateFromDateAndTimeString(task.from_time),
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
                              <div className="grid w-full grid-cols-3 max-md:flex max-md:flex-col max-md:gap-3">
                                <div className="flex gap-1">
                                  <div
                                    title={task.is_billable == 1 ? "Billable task" : ""}
                                    className={cn(
                                      task.is_billable && "cursor-pointer",
                                      "w-6 h-full flex justify-center flex-none"
                                    )}
                                  >
                                    {task.is_billable == 1 && (
                                      <CircleDollarSign className="w-4 h-5 ml-1 stroke-success" />
                                    )}
                                  </div>
                                  <div className="flex flex-col max-w-xs ">
                                    <Typography
                                      variant="p"
                                      className="truncate hover:underline hover:cursor-pointer"
                                      onClick={() => {
                                        setSelectedTask(task.task);
                                        setIsTaskLogDialogBoxOpen(true);
                                      }}
                                    >
                                      {task.subject}
                                    </Typography>
                                    <Typography variant="small" className="truncate text-slate-500">
                                      {task.project_name}
                                    </Typography>
                                  </div>
                                </div>

                                <p
                                  dangerouslySetInnerHTML={{ __html: preProcessLink(task.description ?? "") }}
                                  className="text-sm max-md:pl-6 font-normal col-span-2"
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
  const [hour, setHour] = useState(String(floatToTime(data.hours)));
  const [prevHour, setPrevHour] = useState(String(floatToTime(data.hours)));
  const inputRef = useRef<HTMLInputElement>(null);
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hour = e.target.value;
    if (!hour) {
      return setHour(hour);
    }
    setHour(String(timeStringToFloat(hour)));
  };
  const updateTime = () => {
    if (timeStringToFloat(prevHour) === timeStringToFloat(hour)) return;

    if (hour.trim() == "" || Number.isNaN(hour)) return;
    const value = {
      ...data,
      hours: timeStringToFloat(hour),
      employee: employee,
    };
    callback(value);
    setPrevHour(String(floatToTime(data.hours)));
    if (inputRef.current) {
      inputRef.current.value = String(floatToTime(timeStringToFloat(hour)));
    }
  };
  return (
    <Input
      ref={inputRef}
      defaultValue={hour}
      className={cn("w-20", className)}
      onBlur={updateTime}
      onChange={handleHourChange}
      disabled={disabled}
    />
  );
};
export default EmployeeDetail;
