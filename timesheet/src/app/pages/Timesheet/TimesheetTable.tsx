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

export function TimesheetTable({
  data,
  openDialog,
  updateTimesheetData,
}: {
  data: any;
  openDialog: () => void;
  updateTimesheetData: (timesheet: TimesheetProp) => void;
}) {
  const dates = data?.dates;
  const tasks = data?.tasks;
  return (
    <div>
      <Table className="w-[900px] md:w-full">
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
        />
        <TableFooter className="block p-3">
          <Button
            onClick={() => {
              openDialog();
            }}
          >
            Add Time
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
