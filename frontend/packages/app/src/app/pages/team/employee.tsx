/**
 * External dependencies.
 */
import { useState } from "react";
import { useSelector } from "react-redux";
import { Spinner, Table, TableBody } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */

import { Row } from "@/app/components/timesheet-table/components/row";
import { EmptyRow } from "@/app/components/timesheet-table/components/row/emptyRow";
import { LeaveRow } from "@/app/components/timesheet-table/components/row/leaveRow";
import { TaskLog } from "@/app/pages/task/taskLog";
import { expectatedHours } from "@/lib/utils";
import { RootState } from "@/store";

interface EmployeeProps {
  employee: string;
}

export const Employee = ({ employee }: EmployeeProps) => {
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const teamState = useSelector((state: RootState) => state.team);
  const { data, isLoading } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: employee,
    start_date: teamState.weekDate,
    max_week: 1,
  });
  if (isLoading) {
    return <Spinner />;
  }

  const timesheetData = data?.message.data[Object.keys(data?.message.data)[0]];
  const holidays = data?.message.holidays;
  const leaves = data?.message.leaves;
  return (
    <>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      <div className="w-full flex">
        <Table className="lg:[&_tr]:pr-0">
          <TableBody className="[&_tr]:pr-0">
            {leaves.length > 0 && (
              <LeaveRow
                dates={timesheetData.dates}
                holidayList={holidays}
                leaves={leaves}
                rowClassName="flex w-full"
                headingClassName="min-w-24 w-full max-w-md"
                dataCellClassName="max-w-20 min-w-20 w-full text-center"
                totalCellClassName="max-w-24 w-full items-center justify-end flex"
                showEmptyCell={true}
                expectedHours={expectatedHours(data?.message.working_hour, data?.message.working_frequency)}
              />
            )}
            {Object.keys(timesheetData.tasks).length == 0 && (
              <EmptyRow
                dates={timesheetData.dates}
                holidayList={holidays}
                rowClassName="flex w-full"
                disabled
                headingCellClassName="w-full max-w-md min-w-24"
                totalCellClassName="w-full max-w-24 text-left"
                cellClassName="max-w-20 min-w-20 w-full hover:cursor-default"
              />
            )}
            <Row
              tasks={timesheetData.tasks}
              dates={timesheetData.dates}
              holidayList={holidays}
              onCellClick={() => {}}
              disabled
              hideLikeButton
              likedTaskData={[]}
              rowClassName="border-b border-slate-200 flex w-full"
              taskCellClassName="min-w-24 w-full max-w-md"
              setSelectedTask={setSelectedTask}
              setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
              workingFrequency={data?.message.working_frequency}
              workingHour={data?.message.working_hour}
              cellClassName="cursor-default max-w-20 min-w-20 w-full group text-center hover:bg-slate-100 hover:text-center hover:cursor-default"
              totalCellClassName="max-w-24 w-full flex justify-end items-center"
              showEmptyCell={true}
            />
          </TableBody>
        </Table>
      </div>
    </>
  );
};
