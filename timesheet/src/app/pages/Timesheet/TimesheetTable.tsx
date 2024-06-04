import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TimesheetTableBody } from "./TableBody";
import { useRef } from "react";
import { TaskCellClickProps } from "@/app/types/timesheet";
import { formatDate } from "@/app/lib/utils";

interface TimesheetTableProps {
  data: any;
  onTaskCellClick: ({
    date,
    name,
    parent,
    task,
    description,
    hours,
  }: TaskCellClickProps) => void;
  onApproveTimeClick?: (tableRef: any) => void;
}
export function TimesheetTable({
  data,
  onTaskCellClick,
  onApproveTimeClick,
}: TimesheetTableProps) {
  const dates = data?.dates;
  const tasks = data?.tasks;
  const leaves = data?.leaves;
  const holidays = data?.holidays;
  const tableRef = useRef();

  return (
    <div>
      <Table
        className="w-[900px] md:w-full"
        // @ts-ignore
        ref={tableRef}
        data-start-date={data?.start_date}
        data-end-date={data?.end_date}
      >
        <TableHeader>
          <TableRow className="flex bg-muted/40 hover:bg-muted/40 border-t">
            <TableHead
              key="Heading"
              className="flex w-full max-w-96 font-bold items-center  border-r"
            >
              Tasks
            </TableHead>
            {dates.map((date: string) => {
              const { date: formattedDate, day } = formatDate(date);
              return (
                <TableHead
                  key={date}
                  className="flex w-full  justify-center flex-col text-center max-w-20 font-bold  px-0 hover:cursor-pointer border-r"
                >
                  <div>{day}</div>
                  <div>{formattedDate}</div>
                </TableHead>
              );
            })}
            <TableHead
              key="Total"
              className="flex w-full  justify-center flex-col  text-center max-w-20 font-bold  px-0"
            >
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TimesheetTableBody
          tasks={tasks}
          holidays={holidays}
          dates={dates}
          leaves={leaves}
          onTaskCellClick={onTaskCellClick}
        />
        <TableFooter className="flex p-3 gap-x-4">
          <Button
            variant="outline"
            onClick={() => {
              if (onApproveTimeClick) onApproveTimeClick(tableRef);
            }}
          >
            Submit
          </Button>
        </TableFooter>
      </Table>
    </div>
  );
}
