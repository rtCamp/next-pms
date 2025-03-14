/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Separator,
  TaskStatus,
  Typography,
  useToast,
} from "@next-pms/design-system/components";
import { floatToTime } from "@next-pms/design-system/utils";
import { useFrappePostCall } from "frappe-react-sdk";
import { Heart } from "lucide-react";
/**
 * Internal dependencies
 */
import { LIKED_TASK_KEY } from "@/lib/constant";
import { addAction, toggleLikedByForTask } from "@/lib/storage";
import { cn, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import type { TaskData } from "@/types";
import type { TaskDataProps } from "@/types/timesheet";
import type { TaskHoverCardProps } from "./types";
import TaskStatusIndicator from "../../taskStatusIndicator";

export const TaskHoverCard = ({
  name,
  taskData,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
  likedTaskData,
  getLikedTaskData,
  hideLikeButton = false,
}: TaskHoverCardProps) => {
  const user = useSelector((state: RootState) => state.user);
  const [taskLiked, setTaskedLiked] = useState(false);
  useEffect(() => {
    setTaskedLiked(likedTaskData.some((obj: TaskDataProps) => obj.name === name) || false);
  }, [taskData, likedTaskData]);

  const { call: toggleLikeCall } = useFrappePostCall("frappe.desk.like.toggle_like");
  const { toast } = useToast();

  const handleLike = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    let add: addAction = "Yes";
    if (taskLiked) {
      add = "No";
    }
    const data = {
      name: name,
      add: add,
      doctype: "Task",
    };
    setTaskedLiked((prev) => !prev);
    toggleLikeCall(data)
      .then(() => {
        toggleLikedByForTask(LIKED_TASK_KEY, name, user?.user, add);
        getLikedTaskData();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
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
              className="text-slate-800 truncate overflow-hidden hover:underline flex items-center gap-3"
              onClick={() => {
                setSelectedTask(name);
                setIsTaskLogDialogBoxOpen(true);
              }}
            >
              <span className="truncate">{taskData.subject}</span>
              {!hideLikeButton && (
                <Heart
                  className={cn("hover:cursor-pointer shrink-0", taskLiked && "fill-destructive stroke-destructive")}
                  data-task={name}
                  data-liked-by={taskData?._liked_by}
                  onClick={handleLike}
                />
              )}
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
            <TaskStatus status={taskData.status as TaskData["status"]} />
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
