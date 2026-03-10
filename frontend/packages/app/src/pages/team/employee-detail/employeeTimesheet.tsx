/**
 * External dependencies
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
} from "@next-pms/design-system/components";

import { useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";

/**
 * Internal dependencies
 */
import { TimesheetTable } from "@/components/timesheet-table";
import ExpandableHours from "@/pages/timesheet/components/expandableHours";
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
        Object.entries(teamState.timesheetData.data).map(([key, value]: [string, timesheet], index) => {
          return (
            <div
              key={key}
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
                weeklyStatus={value.status}
                loadingLikedTasks={loadingLikedTasks}
                likedTaskData={likedTaskData}
                getLikedTaskData={getLikedTaskData}
                hideLikeButton={true}
                showHeading={index === 0}
              />
            </div>
          );
        })}
    </>
  );
};
