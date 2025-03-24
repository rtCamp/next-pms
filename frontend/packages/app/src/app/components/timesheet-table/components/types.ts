/**
 * Internal dependencies
 */
import type { TaskData, WorkingFrequency } from "@/types";
import type {
  HolidayProp,
  LeaveProps,
  TaskDataItemProps,
  TaskDataProps,
  TaskProps,
} from "@/types/timesheet";

export type cellProps = {
  date: string;
  data: TaskDataItemProps[];
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
  className?: string;
};

export type HeaderProps = {
  dates: string[];
  holidayList: string[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  weeklyStatus?: string;
  importTasks?: boolean;
  loadingLikedTasks?: boolean;
  showHeading: boolean;
  setTaskInLocalStorage?: () => void;
};

export type submitButtonProps = {
  start_date: string;
  end_date: string;
  onApproval?: (start_date: string, end_date: string) => void;
  status: string;
  expectedHours: number;
  totalHours: number;
  workingFrequency: WorkingFrequency;
};

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
  dates: string[];
  holidays: Array<HolidayProp>;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  showHeading?: boolean;
  workingHour: number;
  disabled?: boolean;
  workingFrequency: WorkingFrequency;
  weeklyStatus?: string;
  importTasks?: boolean;
  loadingLikedTasks?: boolean;
  likedTaskData?: Array<object>;
  getLikedTaskData?: () => void;
  hideLikeButton?: boolean;
};
