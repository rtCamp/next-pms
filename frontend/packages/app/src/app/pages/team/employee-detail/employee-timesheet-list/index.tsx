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
} from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/hooks";
import { floatToTime } from "@next-pms/design-system/utils";
import { useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Calendar, Paperclip } from "lucide-react";

/**
 * Internal dependencies
 */
import { TaskLog } from "@/app/pages/task/components/taskLog";
import ExpandableHours from "@/app/pages/timesheet/components/expandableHours";
import {
  calculateExtendedWorkingHour,
  copyToClipboard,
  expectatedHours,
  getTimesheetHours,
  isDateInRange,
  parseFrappeErrorMsg,
} from "@/lib/utils";
import type { NewTimesheetProps, TaskDataItemProps, timesheet } from "@/types/timesheet";
import { EmployeeTimesheetListItem } from "./timesheetListItem";
import { EmployeeTimesheetListProps } from "./types";
import { StatusIndicator } from "../../components/statusIndicator";
import { getTaskDataForDate, getTimesheetHourForDate } from "../../utils";

/**
 * EmployeeTimesheetList component displays a employee timesheet in flat list form.
 * It includes functionality to update timesheet details, handle status updates,
 * and display task logs in a dialog box.
 *
 * @param {Object} props - The component props.
 * @param {string} props.startDateParam - The start date parameter for filtering timesheets.
 * @param {React.Dispatch<React.SetStateAction<string>>} props.setStartDateParam - Function to set the start date parameter.
 * @param {TeamState} props.teamState - The state of the team, including timesheet data, holidays, and leaves.
 * @param {React.Dispatch<Action>} props.dispatch - Dispatch function for updating the team state.
 *
 * @returns {JSX.Element} The rendered EmployeeTimesheetList component.
 */
const EmployeeTimesheetList = ({
  startDateParam,
  setStartDateParam,
  teamState,
  dispatch,
  setIsAddTimeOpen,
  hideEdit = true,
}: EmployeeTimesheetListProps): JSX.Element => {
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const targetRef = useRef<HTMLDivElement>(null);
  const { call } = useFrappePostCall("next_pms.timesheet.api.timesheet.update_timesheet_detail");
  const { toast } = useToast();
  const [, setTask] = useState<TaskDataItemProps>({} as TaskDataItemProps);
  const handleTimeChange = (value: NewTimesheetProps) => {
    call(value)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
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

  const dailyWorkingHour = expectatedHours(
    teamState.timesheetData.working_hour,
    teamState.timesheetData.working_frequency
  );

  return (
    <>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      {teamState.timesheetData.data &&
        Object.keys(teamState.timesheetData.data).length > 0 &&
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet]) => {
          const data = getTimesheetHours(
            value.dates,
            value.total_hours,
            teamState.timesheetData.leaves,
            teamState.timesheetData.holidays,
            dailyWorkingHour
          );

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
                        totalHours={floatToTime(data.totalHours)}
                        workingHours={floatToTime(data.totalHours - data.timeOffHours)}
                        timeoffHours={floatToTime(data.timeOffHours)}
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
                    const matchingTasks = getTaskDataForDate(value.tasks, date);
                    const data = getTimesheetHourForDate(
                      date,
                      matchingTasks,
                      teamState.timesheetData.holidays,
                      teamState.timesheetData.leaves,
                      dailyWorkingHour
                    );

                    const isExtended = calculateExtendedWorkingHour(
                      data.totalHours,
                      teamState.timesheetData.working_hour,
                      teamState.timesheetData.working_frequency
                    );
                    return (
                      <EmployeeTimesheetListItem
                        employee={teamState.employee}
                        hasLeave={data.hasLeave}
                        tasks={matchingTasks}
                        date={date}
                        isTimeExtended={isExtended}
                        isHoliday={data.isHoliday}
                        holidayDescription={data.holidayDescription}
                        dailyWorkingHour={dailyWorkingHour}
                        totalHours={data.totalHours}
                        isHalfDayLeave={data.isHalfDayLeave}
                        index={index}
                        handleTimeChange={handleTimeChange}
                        onTaskClick={(name) => {
                          setSelectedTask(name);
                          setIsTaskLogDialogBoxOpen(true);
                        }}
                        hourInputClassName="ml-0 w-12"
                        taskClassName="lg:max-w-xs"
                        setIsAddTimeOpen={setIsAddTimeOpen!}
                        setTask={setTask}
                        hideEdit={hideEdit}
                      />
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

export default EmployeeTimesheetList;
