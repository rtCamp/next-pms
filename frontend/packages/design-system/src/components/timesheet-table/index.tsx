/**
 * External dependencies
 */
import { useState } from "react";
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
type TaskProps = {
  [key: string]: TaskDataProps;
};

type TimesheetTableProps = {
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
  importTasks?: boolean;
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
}: TimesheetTableProps) => {
  const holidayList = getHolidayList(holidays);
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
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
