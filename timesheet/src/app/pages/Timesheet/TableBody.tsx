import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/app/lib/utils";
import { TimesheetProp } from "@/app/types/timesheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export function TimesheetTableBody({
  tasks,
  dates,
  updateTimesheetData,
  openDialog,
}: {
  tasks: Object;
  dates: Array<string>;
  updateTimesheetData: (timesheet: TimesheetProp) => void;
  openDialog: () => void;
}) {
  return (
    <>
      <TableBody className="[&_tr:last-child]:border-b">
        {Object.keys(tasks).length > 0 ? (
          Object.entries(tasks).map(([task, taskData]: [string, any]) => {
            let totalHours = 0;
            return (
              <TableRow key={task} className="flex">
                <TableCell className=" flex w-full max-w-96  items-center text-justify font-medium hover:cursor-pointer border-r ">
                  {task}
                </TableCell>
                {dates.map((date: string) => {
                  const taskDateData = taskData.data.find(
                    (data: any) =>
                      getDateFromDateAndTime(data.from_time) === date
                  );
                  if (taskDateData && taskDateData.hours) {
                    totalHours += taskDateData.hours;
                  }
                  return (
                    <TaskCell
                      openDialog={openDialog}
                      name={taskDateData?.name ?? ""}
                      parent={taskDateData?.parent ?? ""}
                      task={taskData?.name ?? ""}
                      description={taskDateData?.description ?? ""}
                      hours={taskDateData?.hours ?? 0}
                      date={date}
                      isCellDisabled={false}
                      updateTimesheet={updateTimesheetData}
                    />
                  );
                })}
                <TableCell
                  key="totlaHours"
                  className="flex w-full justify-center flex-col font-bold max-w-20 px-0 text-center hover:cursor-pointer hover:p-[3px] hover:border"
                >
                  {totalHours}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow className="flex">
            <TableCell className=" flex w-full font-bold items-center  justify-center text-justify font-medium">
              No tasks found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </>
  );
}

function TaskCell({
  date,
  name,
  parent,
  description,
  hours,
  task,
  isCellDisabled,
  openDialog,
  updateTimesheet,
}: {
  date: string;
  task: any;
  name: string;
  parent: string;
  description: string;
  hours: number;
  isCellDisabled: boolean;
  openDialog: () => void;
  updateTimesheet: (timesheet: TimesheetProp) => void;
}) {
  return (
    <TableCell
      onClick={() => {
        const isUpdate = name ? true : false;
        updateTimesheet({
          name,
          parent,
          task,
          date,
          description,
          hours,
          isUpdate,
        });
        openDialog();
      }}
      key={date}
      className={cn(
        "flex w-full justify-center flex-col  max-w-20  p-0 text-center hover:cursor-pointer border-r ",
        `${isCellDisabled ? "text-muted-foreground bg-muted " : ""}`
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-full flex justify-center items-center">
            {hours ? hours : "-"}
          </div>
        </TooltipTrigger>
        <TooltipContent>{description}</TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}
