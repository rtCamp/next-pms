import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn, floatToTime, getTodayDate } from "@/app/lib/utils";
import { Dateprops } from "@/app/types/timesheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimesheetTableBodyProps {
  tasks: Object;
  dates: Array<Dateprops>;
  leaves: any;
  dispatch: React.Dispatch<{
    type: string;
    payload: any;
  }>;
}

export function TimesheetTableBody({
  tasks,
  dates,
  leaves,
  dispatch,
}: TimesheetTableBodyProps) {
  return (
    <>
      <TableBody className="[&_tr:last-child]:border-b">
        {leaves.length > 0 && <LeaveRow dates={dates} leaves={leaves} />}
        {Object.keys(tasks).length > 0 ? (
          Object.entries(tasks).map(([task, taskData]: [string, any]) => {
            let totalHours = 0;
            return (
              <TableRow key={task} className="flex">
                <TableCell className=" flex w-full max-w-96  items-center text-justify font-medium hover:cursor-pointer border-r ">
                  {task}
                </TableCell>
                {dates.map((iter: Dateprops) => {
                  const taskDateData = taskData.data.find(
                    (data: any) =>
                      getDateFromDateAndTime(data.from_time) === iter.date
                  );
                  if (taskDateData && taskDateData.hours) {
                    totalHours += taskDateData.hours;
                  }
                  const leaveData = leaves.find((data: any) => {
                    return (
                      iter.date >= data.from_date && iter.date <= data.to_date
                    );
                  });
                  return (
                    <TaskCell
                      dispatch={dispatch}
                      name={taskDateData?.name ?? ""}
                      parent={taskDateData?.parent ?? ""}
                      task={taskData?.name ?? ""}
                      description={taskDateData?.description ?? ""}
                      hours={taskDateData?.hours ?? 0}
                      date={iter.date}
                      isCellDisabled={
                        iter.is_holiday ||
                        (leaveData && !leaveData.half_day) ||
                        getTodayDate() < iter.date ||
                        isDateNotInCurrentWeek(iter.date)
                      }
                    />
                  );
                })}
                <TableCell
                  key="TotlaHour"
                  className="flex w-full justify-center flex-col font-bold max-w-20 px-0 text-center hover:cursor-pointer hover:p-[3px] hover:border"
                >
                  {floatToTime(totalHours)}
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
  dispatch,
}: {
  date: string;
  task: any;
  name: string;
  parent: string;
  description: string;
  hours: number;
  isCellDisabled: boolean;
  dispatch: React.Dispatch<{
    type: string;
    payload: any;
  }>;
}) {
  return (
    <TableCell
      onClick={() => {
        const isUpdate = name ? true : false;

        dispatch({
          type: "SetTimesheet",
          payload: { name, parent, task, date, description, hours, isUpdate },
        });
        dispatch({ type: "SetDialog", payload: true });
      }}
      key={date}
      className={cn(
        "flex w-full justify-center flex-col  max-w-20  p-0 text-center  border-r ",
        `${
          isCellDisabled
            ? "text-muted-foreground bg-muted hover:cursor-not-allowed "
            : "hover:cursor-pointer"
        }`
      )}
    >
      {hours ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full flex justify-center items-center">
                {floatToTime(hours)}
              </div>
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </>
      ) : (
        "-"
      )}
    </TableCell>
  );
}

function LeaveRow({ dates, leaves }: { dates: Array<Dateprops>; leaves: any }) {
  let totalHours = 0;
  return (
    <TableRow key={1} className="flex">
      <TableCell className=" flex w-full max-w-96  items-center text-justify font-medium hover:cursor-pointer border-r ">
        Time Off
      </TableCell>
      {dates.map((iter: Dateprops) => {
        const leaveData = leaves.find((data: any) => {
          return iter.date >= data.from_date && iter.date <= data.to_date;
        });
        if (leaveData) {
          totalHours += leaveData?.half_day ? 4 : 8;
          return (
            <TaskCell
              dispatch={() => {}}
              name={""}
              parent={""}
              task={""}
              description={leaveData?.description}
              hours={leaveData?.half_day ? 4 : 8}
              date={iter.date}
              isCellDisabled={true}
            />
          );
        } else {
          return (
            <TaskCell
              dispatch={() => {}}
              name={""}
              parent={""}
              task={""}
              description={""}
              hours={0}
              date={iter.date}
              isCellDisabled={true}
            />
          );
        }
      })}
      <TableCell
        key="TotlaHour"
        className="flex w-full justify-center flex-col font-bold max-w-20 px-0 text-center hover:cursor-pointer hover:p-[3px] hover:border"
      >
        {floatToTime(totalHours)}
      </TableCell>
    </TableRow>
  );
}

function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}

function isDateNotInCurrentWeek(dateStr: string) {
  const givenDate = new Date(dateStr);
  const today = new Date();

  // Calculate the start and end of the current week
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0); // Set to start of day

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999); // Set to end of day

  // Check if the given date is outside the current week
  return givenDate < startOfWeek || givenDate > endOfWeek;
}
