/**
 * Internal dependencies
 */
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@design-system/components/hover-card";
import Separator from "@design-system/components/separator";
import TaskStatus from "@design-system/components/task-status";
import Typography from "@design-system/components/typography";
import { cn, floatToTime } from "@design-system/utils";
import { TaskStatusIndicator } from "./taskStatusIndicator";
import { TaskDataProps } from "../type";

type TaskHoverCardProps = {
  name: string;
  taskData: TaskDataProps;
  setSelectedTask: (name: string) => void;
  setIsTaskLogDialogBoxOpen: (isOpen: boolean) => void;
};
export const TaskHoverCard = ({ name, taskData, setSelectedTask, setIsTaskLogDialogBoxOpen }: TaskHoverCardProps) => {
  return (
    <HoverCard openDelay={1000} closeDelay={0}>
      <div className="flex w-full gap-2">
        <TaskStatusIndicator
          actualTime={taskData.actual_time}
          expectedTime={taskData.expected_time}
          status={taskData.status}
          className="flex-shrink-0"
        />
        <div className="flex w-full truncate overflow-hidden flex-col">
          <HoverCardTrigger>
            <Typography
              variant="p"
              className="text-slate-800 truncate overflow-hidden hover:underline"
              onClick={() => {
                setSelectedTask(name);
                setIsTaskLogDialogBoxOpen(true);
              }}
            >
              {taskData.subject}
            </Typography>

            <Typography variant="small" className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden ">
              {taskData?.project_name}
            </Typography>
          </HoverCardTrigger>
        </div>
      </div>

      <HoverCardContent className="max-w-md w-full">
        <span className="flex gap-x-2">
          <div>
            <Typography>{taskData.subject}</Typography>
            <Typography variant="small" className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden ">
              {taskData.project_name}
            </Typography>
          </div>
          <span>
            <TaskStatus status={taskData.status} />
          </span>
        </span>
        <Separator className="my-1" />
        <div className="flex  justify-between">
          <Typography>Estimated Time</Typography>
          <Typography>{floatToTime(taskData.expected_time)}</Typography>
        </div>
        <div className="flex  justify-between">
          <Typography>Actual Time</Typography>
          <Typography
            className={cn(
              taskData.actual_time > taskData.expected_time && "text-destructive",
              taskData.actual_time < taskData.expected_time && "text-success"
            )}
          >
            {floatToTime(taskData.actual_time)}
          </Typography>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
