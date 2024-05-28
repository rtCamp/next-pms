import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Dateprops } from "@/app/types/timesheet";
import { Button } from "@/components/ui/button";
import { TimesheetTableBody } from "./TableBody";
import { useRef } from "react";

export function TimesheetTable({
  data,
  dispatch,
}: {
  data: any;
  dispatch: React.Dispatch<{
    type: string;
    payload: any;
  }>;
}) {
  const dates = data?.dates;
  const tasks = data?.tasks;
  const leaves = data?.leaves;
  const holidays = data?.holidays;
  const tableRef = useRef();

  return (
    <div>
      <Table
        className="w-[900px] md:w-full"
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
          dispatch={dispatch}
          tasks={tasks}
          holidays={holidays}
          dates={dates}
          leaves={leaves}
        />
        <TableFooter className="flex p-3 gap-x-4">
          <Button
            onClick={() => {
              dispatch({ type: "SetDialog", payload: true });
            }}
          >
            Add Time
          </Button>
          <Button
            onClick={() => {
              dispatch({
                type: "SetDateRange",
                payload: {
                  start_date:
                    // @ts-ignore
                    tableRef?.current?.getAttribute("data-start-date"),
                  // @ts-ignore
                  end_date: tableRef?.current?.getAttribute("data-end-date"),
                },
              });

              dispatch({ type: "SetApprovalDialog", payload: true });
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
