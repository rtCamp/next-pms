import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TimesheetTableBody({
  tasks,
  dates,
}: {
  tasks: Object;
  dates: Array<string>;
}) {
  return (
    <>
      <TableBody>
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
                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TableCell
                              key={date}
                              data-action="update-task"
                              data-time-name={taskDateData.name}
                              data-time-parent={taskDateData.parent}
                              data-time-task={taskDateData.task}
                              data-time-date={date}
                              className="flex w-full justify-center flex-col  max-w-20  px-0 text-center hover:cursor-pointer border-r hover:p-[3px] hover:border hover:border-r-2"
                            >
                              {taskDateData.hours}
                            </TableCell>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64">
                            <p>{taskDateData.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  } else {
                    return (
                      <TableCell
                        key={date}
                        data-action="add-task"
                        data-time-date={date}
                        data-time-task={taskData.name}
                        className="flex w-full justify-center flex-col  max-w-20  px-0 text-center hover:cursor-pointer border-r hover:p-[3px] hover:border hover:border-r-2"
                      >
                        -
                      </TableCell>
                    );
                  }
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

function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}
