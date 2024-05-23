import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { TimesheetProp, Dateprops } from "@/app/types/timesheet";
import { Button } from "@/components/ui/button";
import { TimesheetTableBody } from "./TableBody";
import { useRef } from 'react';
import { dateRangeProps } from "@/app/types/timesheet";

export function TimesheetTable({
  data,
  openDialog,
  openApprovalDialog,
  setDateRange,
  updateTimesheetData,
}: {
  data: any;
  openDialog: () => void;
  openApprovalDialog: () => void;
    updateTimesheetData: (timesheet: TimesheetProp) => void;
    setDateRange: React.Dispatch<React.SetStateAction<dateRangeProps>>;
}) {
  const dates = data?.dates;
  const tasks = data?.tasks;
  const leaves = data?.leaves;
  const tableRef = useRef();
  
  return (
    <div>
      <Table className="w-[900px] md:w-full" ref={tableRef} data-start-date={ data?.start_date} data-end-date={ data?.end_date}>
        <TableHeader>
          <TableRow className="flex bg-muted/40 hover:bg-muted/40 border-t">
            <TableHead
              key="Heading"
              className="flex w-full max-w-96 font-bold items-center  border-r"
            >
              Tasks
            </TableHead>
            {dates.map((iter: Dateprops) => {
              const { date: formattedDate, day } = formatDate(iter.date);
              return (
                <TableHead
                  key={iter.date}
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
          updateTimesheetData={updateTimesheetData}
          openDialog={openDialog}
          tasks={tasks}
          dates={dates}
          leaves={leaves}
        />
        <TableFooter className="flex p-3 gap-x-4">
          <Button
            onClick={() => {
              openDialog();
            }}
          >
            Add Time
          </Button>
          <Button
            onClick={() => {
              setDateRange({
                // @ts-ignore
                start_date: tableRef?.current?.getAttribute("data-start-date"),
                // @ts-ignore
                end_date: tableRef?.current?.getAttribute("data-end-date"),
              })
              openApprovalDialog();
            }}
          >
            Submit
          </Button>
        </TableFooter>
      </Table>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  const month = date.toLocaleString("default", { month: "short" });
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });
  return { date: `${month} ${dayOfMonth}`, day: dayOfWeek };
}
