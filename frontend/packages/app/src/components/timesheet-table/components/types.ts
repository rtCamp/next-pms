/**
 * Internal dependencies
 */
import type { TaskData, WorkingFrequency } from "@/types";
import type {
  HolidayProp,
  LeaveProps,
  NewTimesheetProps,
  TaskDataProps,
  TaskProps,
} from "@/types/timesheet";

export type TaskHoverCardProps = {
  name: string;
  taskData: TaskData;
  setSelectedTask: (name: string) => void;
  setIsTaskLogDialogBoxOpen: (val: boolean) => void;
  likedTaskData: TaskDataProps[];
  getLikedTaskData: () => void;
  hideLikeButton?: boolean;
};

export type weekTotalProps = {
  total: number;
  expected_hour: number;
  frequency: WorkingFrequency;
  className?: string;
};

export type timesheetTableProps = {
  label?: string;
  employee?: string;
  dates: string[];
  holidays: Array<HolidayProp>;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  firstWeek: boolean;
  workingHour: number;
  disabled?: boolean;
  workingFrequency: WorkingFrequency;
  weeklyStatus?: string;
  importTasks?: boolean;
  loadingLikedTasks?: boolean;
  likedTaskData?: Array<object>;
  getLikedTaskData?: () => void;
  hideLikeButton?: boolean;
  onButtonClick?: () => void;
  status?: string;
  setSelectedTask?: (taskKey: string) => void;
};
