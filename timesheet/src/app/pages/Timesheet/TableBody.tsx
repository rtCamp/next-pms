import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/app/lib/utils";
import React, { MouseEvent, useState } from "react";

interface TaskData {
  parent: string;
  task: string;
  hours: number;
  name: string;
  description: string;
}
interface TimesheetProp {
  timesheetName: string;
  timesheetParent: string;
  timesheetTask: string;
  timesheetDate: string;
  timesheetAction: string;
}

export function TimesheetTableBody({
  tasks,
  dates,
}: {
  tasks: Object;
  dates: Array<string>;
}) {
  const defaultTimesheetState = {
    timesheetName: "",
    timesheetParent: "",
    timesheetTask: "",
    timesheetDate: "",
    timesheetAction: "add-task",
  };
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timesheet, setTimesheet] = useState<TimesheetProp>(
    defaultTimesheetState
  );
  const updateTimesheet = (timesheet: TimesheetProp) => {
    setTimesheet(timesheet);
  };
  const resetTimesheet = () => {
    setTimesheet(defaultTimesheetState);
  };
  return (
    <>
      <TableBody>
        <TimesheetHoverCard tooltip={tooltip} />
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
                      openDialog={() => setIsDialogOpen(true)}
                      tooltipEvent={setTooltip}
                      taskDateData={taskDateData}
                      task={taskData}
                      date={date}
                      disabled={false}
                      timesheet={timesheet}
                      updateTimesheet={updateTimesheet}
                      resetTimesheet={resetTimesheet}
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
      <TimesheetDialog isOpen={isDialogOpen} />
    </>
  );
}

function TaskCell({
  taskDateData,
  date,
  task,
  disabled,
  timesheet,
  openDialog,
  tooltipEvent,
  updateTimesheet,
  resetTimesheet,
}: {
  taskDateData: TaskData;
  date: string;
  task: any;
  disabled: boolean;
  openDialog: () => void;
  tooltipEvent: React.Dispatch<
    React.SetStateAction<{
      visible: boolean;
      content: string;
      x: number;
      y: number;
    }>
  >;
  timesheet: TimesheetProp;
  updateTimesheet: (timesheet: TimesheetProp) => void;
  resetTimesheet: () => void;
}) {
  const hours = taskDateData?.hours ?? "-";
  const description = taskDateData?.description ?? "";
  const openTooltip = (e: any, content: string) => {
    const rect = e.target.getBoundingClientRect();
    console.log(rect);
    tooltipEvent({
      visible: true,
      content: content,
      x: rect.x + window.scrollX,
      y: rect.y,
    });
  };
  const closeTooltip = () => {
    tooltipEvent({
      visible: false,
      content: "",
      x: 0,
      y: 0,
    });
  };
  return (
    <TableCell
      onClick={openDialog}
      onMouseOver={(e) => {
        openTooltip(e, description);
      }}
      onMouseOut={closeTooltip}
      key={date}
      className={cn(
        "flex w-full justify-center flex-col  max-w-20  p-0 text-center hover:cursor-pointer border-r ",
        `${disabled ? "text-muted-foreground bg-muted " : ""}`
      )}
    >
      {hours}
    </TableCell>
  );
}

function TimesheetDialog({ isOpen }: { isOpen: boolean }) {
  return (
    <Dialog open={isOpen}>
      <DialogTrigger className="bg-transparent p-0 border-0 h-full focus:outline-0 focus:outline-none focus:outline-offset-0"></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Share link</DialogTitle>
        <DialogDescription>
          Anyone who has this link will be able to view this.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

function TimesheetHoverCard({ tooltip }: { tooltip: any }) {
  return (
    <HoverCard open={tooltip.visible}>
      <HoverCardTrigger></HoverCardTrigger>
      <HoverCardContent className="relative" style={{ left: tooltip.x }}>
        {tooltip.content}
      </HoverCardContent>
    </HoverCard>
  );
}

function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}
