/**
 * External dependencies
 */
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Separator,
  Typography,
} from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString, prettyDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { floatToTime, preProcessLink } from "@next-pms/design-system/utils";
import { useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Calendar, CircleDollarSign, Paperclip } from "lucide-react";
/**
 * Internal dependencies
 */
import {
  calculateExtendedWorkingHour,
  cn,
  copyToClipboard,
  expectatedHours,
  isDateInRange,
  parseFrappeErrorMsg,
} from "../../../../lib/utils";
import {
  LeaveProps,
  NewTimesheetProps,
  TaskDataItemProps,
  TaskDataProps,
  timesheet,
} from "../../../../types/timesheet";
import { TaskLog } from "../../../pages/task/components/taskLog";
import ExpandableHours from "../../timesheet/components/expandableHours";
import { StatusIndicator } from "../components/statusIndicator";
import { Action, TeamState } from "../reducer";
import { HourInput } from "./hourInput";

type EmployeeTimesheetListProps = {
  callback?: () => void;
  startDateParam: string;
  setStartDateParam: React.Dispatch<React.SetStateAction<string>>;
  teamState: TeamState;
  dispatch: React.Dispatch<Action>;
};

/**
 * EmployeeTimesheetList component displays a employee timesheet in flat list form.
 * It includes functionality to update timesheet details, handle status updates,
 * and display task logs in a dialog box.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.callback] - Optional callback function to be called after updating timesheet details.
 * @param {string} props.startDateParam - The start date parameter for filtering timesheets.
 * @param {React.Dispatch<React.SetStateAction<string>>} props.setStartDateParam - Function to set the start date parameter.
 * @param {TeamState} props.teamState - The state of the team, including timesheet data, holidays, and leaves.
 * @param {React.Dispatch<Action>} props.dispatch - Dispatch function for updating the team state.
 *
 * @returns {JSX.Element} The rendered EmployeeTimesheetList component.
 */
export const EmployeeTimesheetList = ({
  callback,
  startDateParam,
  setStartDateParam,
  teamState,
  dispatch,
}: EmployeeTimesheetListProps): JSX.Element => {
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const targetRef = useRef<HTMLDivElement>(null);
  const { call } = useFrappePostCall("next_pms.timesheet.api.timesheet.update_timesheet_detail");
  const { toast } = useToast();
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
  const handleStatusClick = (startDate: string, endDate: string) => {
    const data = {
      startDate: startDate,
      endDate: endDate,
    };
    dispatch({ type: "SET_DATE_RANGE", payload: { dateRange: data, isAprrovalDialogOpen: true } });
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
    <>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet]) => {
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
                      <StatusIndicator status={value.status} />
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
                              <HourInput
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
    </>
  );
};
