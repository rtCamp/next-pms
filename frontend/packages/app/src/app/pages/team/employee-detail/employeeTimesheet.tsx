/**
 * External dependencies
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Separator,
} from "@next-pms/design-system/components";
import { floatToTime } from "@next-pms/design-system/utils";
import { useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Calendar, Paperclip } from "lucide-react";
/**
 * Internal dependencies
 */
import { TimesheetTable } from "@/app/components/timesheet-table";
import ExpandableHours from "@/app/pages/timesheet/components/expandableHours";
import { copyToClipboard, expectatedHours, getTimesheetHours, isDateInRange } from "@/lib/utils";
import type { NewTimesheetProps, timesheet } from "@/types/timesheet";
import type { EmployeeTimesheetProps } from "./types";
import { StatusIndicator } from "../components/statusIndicator";

/**
 * EmployeeTimesheet component displays the timesheet details of an employee.
 * It fetches liked tasks data and displays timesheet data in an accordion format.
 *
 * @param {Object} props - The component props
 * @param {string} props.startDateParam - The start date parameter
 * @param {React.Dispatch<React.SetStateAction<string>>} props.setStartDateParam - Function to set the start date parameter
 * @param {TeamState} props.teamState - The state of the team
 * @param {React.Dispatch<Action>} props.dispatch - The dispatch function to update the team state
 *
 * @returns {JSX.Element} The EmployeeTimesheet component
 */
export const EmployeeTimesheet = ({
  startDateParam,
  setStartDateParam,
  teamState,
  dispatch,
}: EmployeeTimesheetProps): JSX.Element => {
  const { id } = useParams();
  const targetRef = useRef<HTMLDivElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCellClick = (timesheet: NewTimesheetProps) => {
    dispatch({ type: "SET_TIMESHEET", payload: { timesheet, id } });
    if (timesheet.hours > 0) {
      dispatch({ type: "SET_EDIT_DIALOG", payload: true });
    } else {
      dispatch({ type: "SET_DIALOG", payload: true });
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
            <Accordion type="single" key={key} collapsible defaultValue={key}>
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
    </>
  );
};
