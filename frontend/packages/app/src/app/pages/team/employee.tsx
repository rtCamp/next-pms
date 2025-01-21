/**
 * External dependencies.
 */
import { useState } from "react";
import { useSelector } from "react-redux";
import { Spinner, Typography, Table, TableBody, TableCell, TableRow } from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { useFrappeGetCall } from "frappe-react-sdk";
import { CircleDollarSign } from "lucide-react";
/**
 * Internal dependencies.
 */

import { Cell } from "@/app/components/timesheet-table/components/dataCell";
import { EmptyRow } from "@/app/components/timesheet-table/components/row/emptyRow";
import { LeaveRow } from "@/app/components/timesheet-table/components/row/leaveRow";
import { TaskLog } from "@/app/pages/task/taskLog";
import { cn, expectatedHours } from "@/lib/utils";
import { RootState } from "@/store";
import { TaskDataProps, TaskDataItemProps } from "@/types/timesheet";

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
    <div>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      <Table>
        <TableBody className="[&_tr]:pr-0">
          {leaves.length > 0 && (
            <LeaveRow
              dates={timesheetData.dates}
              holidayList={holidays}
              leaves={leaves}
              rowClassName="flex"
              headingClassName="w-full min-w-md text-left max-w-md"
              dataCellClassName="max-w-20 min-w-20 w-full text-center"
              totalCellClassName="max-w-24 w-full items-center justify-end flex"
              expectedHours={expectatedHours(data?.message.working_hour, data?.message.working_frequency)}
            />
          )}
          {Object.keys(timesheetData.tasks).length == 0 && (
            <EmptyRow
              dates={timesheetData.dates}
              holidayList={holidays}
              rowClassName="flex"
              disabled
              headingCellClassName="w-full max-w-md "
              totalCellClassName="w-full max-w-24 text-left"
              cellClassName="max-w-20 min-w-20 w-full hover:cursor-default"
            />
          )}
          {Object.keys(timesheetData.tasks).length > 0 &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //   @ts-ignore
            Object.entries(timesheetData.tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200 flex w-full">
                  <TableCell className="w-full min-w-24 max-w-md overflow-hidden">
                    <Typography
                      variant="p"
                      className="text-slate-800  truncate w-full hover:underline hover:cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsTaskLogDialogBoxOpen(true);
                      }}
                    >
                      {taskData.subject}
                    </Typography>
                    <Typography variant="small" className="text-slate-500 truncate">
                      {taskData.project_name}
                    </Typography>
                  </TableCell>
                  {timesheetData.dates.map((date: string, key: number) => {
                    let data = taskData.data.filter(
                      (data: TaskDataItemProps) => getDateFromDateAndTimeString(data.from_time) === date
                    );
                    data.forEach((item: TaskDataItemProps) => {
                      totalHours += item.hours;
                    });
                    if (data.length === 0) {
                      data = [
                        {
                          hours: 0,
                          description: "",
                          name: "",
                          parent: "",
                          task: taskData.name,
                          from_time: date,
                          docstatus: 0,
                          is_billable: false,
                        },
                      ];
                    }
                    const isHoliday = holidays.includes(date);
                    return (
                      <Cell
                        key={key}
                        date={date}
                        data={data}
                        isHoliday={isHoliday}
                        disabled
                        className={cn(
                          "max-w-20 w-full group text-center hover:bg-slate-100 hover:text-center hover:cursor-default",
                          "cursor-default"
                        )}
                      />
                    );
                  })}
                  <TableCell
                    className={cn(
                      "max-w-24 w-full  flex justify-between items-center",
                      !taskData.is_billable && "justify-end"
                    )}
                  >
                    {taskData.is_billable == true && <CircleDollarSign className="stroke-success w-4 h-4" />}
                    <Typography variant="p" className="text-slate-800 font-medium">
                      {floatToTime(totalHours)}
                    </Typography>
                  </TableCell>
                  {/* added empty TableCell to make it even when screen get's smaller */}
                  <TableCell className={cn("flex max-w-20 w-full justify-center items-center")}></TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
};
