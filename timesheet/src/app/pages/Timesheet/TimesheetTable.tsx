import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimesheetTableBody } from "./TableBody";
import { TimesheetProp } from "@/app/types/timesheet";
export function TimesheetTable({
  data,
  openDialog,
  tooltipEvent,
  updateTimesheetData,
}: {
  data: any;
    openDialog: () => void;
    tooltipEvent: React.Dispatch<
    React.SetStateAction<{
      visible: boolean;
      content: string;
      x: number;
      y: number;
    }>
  >;
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
              key="Heading"
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
          tooltipEvent={tooltipEvent}
          dates={dates}
        />
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
