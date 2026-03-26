/**
 * Internal dependencies
 */
import type { TaskData } from "@/types";
import type { TaskDataProps } from "@/types/timesheet";

export type TaskHoverCardProps = {
  name: string;
  taskData: TaskData;
  setSelectedTask: (name: string) => void;
  setIsTaskLogDialogBoxOpen: (val: boolean) => void;
  likedTaskData: TaskDataProps[];
  getLikedTaskData: () => void;
  hideLikeButton?: boolean;
};
