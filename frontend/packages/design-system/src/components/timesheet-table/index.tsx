/**
 * External dependencies
 */

import { useEffect } from "react";
/**
 * Internal dependencies
 */
import { Table, TableBody } from "../table";
import { default as TimesheetHeader } from "./components/head";
import { default as TimesheetRow } from "./components/row";
import { EmptyRow } from "./components/row/emptyRow";
import { LeaveRow } from "./components/row/leaveRow";
import { TotalRow } from "./components/row/totalRow";
import { HolidayProps, LeaveProps, TaskDataProps, WorkingFrequency } from "./type";
import { getHolidayList } from "./utils";
import ErrorFallback from "../error-fallback";
import { getLocalStorage, removeLocalStorage } from "@design-system/utils/storage";
export type TaskProps = {
  [key: string]: TaskDataProps;
};

export type TimesheetTableProps = {
  dates: string[];
  holidays: Array<HolidayProps>;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  showHeading?: boolean;
  workingHour: number;
  disabled?: boolean;
  workingFrequency: WorkingFrequency;
  weeklyStatus: string;
  importTasks?: (key: string) => void;
  setSelectedTask: React.Dispatch<React.SetStateAction<string>>;
  setIsTaskLogDialogBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
const TimesheetTable = ({
  showHeading = true,
  importTasks,
  dates,
  weeklyStatus,
  holidays,
  leaves,
  workingHour,
  workingFrequency,
  tasks,
  disabled,
  onCellClick,
  setIsTaskLogDialogBoxOpen,
  setSelectedTask,
}: TimesheetTableProps) => {
  const holidayList = getHolidayList(holidays);
  const key = dates[0] + "-" + dates[dates.length - 1];
  const liked_tasks = getLocalStorage(key) ?? [];
  const filteredLikedTasks = liked_tasks.filter(
    (likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)
  );
  useEffect(() => {
    if (weeklyStatus === "Approved") {
      removeLocalStorage(key);
    }
  }, [removeLocalStorage, weeklyStatus]);

  return (
    <ErrorFallback>
      <Table>
        <TimesheetHeader
          showHeading={showHeading}
          importTasks={importTasks}
          dates={dates}
          weeklyStatus={weeklyStatus}
          holidays={holidays}
        />
        <TableBody>
          <TotalRow
            dates={dates}
            holidayList={holidays}
            leaves={leaves}
            tasks={tasks}
            workingHour={workingHour}
            workingFrequency={workingFrequency}
          />
          <LeaveRow leaves={leaves} dates={dates} holidayList={holidayList} workingHour={workingHour} />
          {weeklyStatus != "Approved" && (
            <EmptyRow
              dates={dates}
              holidays={holidays}
              onCellClick={onCellClick}
              setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
              setSelectedTask={setSelectedTask}
            />
          )}
          {weeklyStatus != "Approved" &&
            filteredLikedTasks.length > 0 &&
            filteredLikedTasks.map((task) => {
              return (
                <EmptyRow
                  key={task.name}
                  dates={dates}
                  holidays={holidays}
                  onCellClick={onCellClick}
                  setSelectedTask={setSelectedTask}
                  disabled={disabled}
                  setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
                  name={task.name}
                  taskData={task}
                />
              );
            })}
          <TimesheetRow
            dates={dates}
            taskData={tasks}
            holidays={holidays}
            disabled={disabled}
            onCellClick={onCellClick}
            setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
            setSelectedTask={setSelectedTask}
          />
        </TableBody>
      </Table>
    </ErrorFallback>
  );
};

export default TimesheetTable;
