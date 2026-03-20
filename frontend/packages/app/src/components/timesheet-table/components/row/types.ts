/**
 * External dependencies.
 */
import {
  HeaderRowProps as BaseHeaderRowProps,
  WeekRowProps as BaseWeekRowProps,
  TotalRowProps as BaseTotalRowProps,
  ProjectRowProps as BaseProjectRowProps,
  TaskRowProps as BaseTaskRowProps,
  TimeOffRowProps as BaseTimeOffRowProps,
  RowStatus,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import type { WorkingFrequency } from "@/types";
import { TaskStatusType } from "@/types/task";
import type {
  HolidayProp,
  LeaveProps,
  NewTimesheetProps,
  TaskDataProps,
  TaskProps,
} from "@/types/timesheet";

export interface HeaderRowProps extends Omit<BaseHeaderRowProps, "days"> {
  dates: string[];
  showHeading: boolean;
}

export interface WeekRowProps extends Omit<BaseWeekRowProps, "status"> {
  dates: string[];
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  holidays: Array<HolidayProp>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  status: TaskStatusType;
  children?: (props: {
    totalHours: string;
    totalTimeEntries: string[];
    totalTimeEntriesInHours: number[];
    dailyWorkingHours: number;
    status: RowStatus;
  }) => React.ReactNode;
}

export type TotalRowProps = BaseTotalRowProps;

export interface ProjectRowProps extends Omit<
  BaseProjectRowProps,
  "timeEntries"
> {
  dates: string[];
  tasks: TaskProps;
  children?: React.ReactNode;
}

export interface TaskRowProps extends Omit<
  BaseTaskRowProps,
  "timeEntries" | "status" | "onCellClick"
> {
  dates: string[];
  taskKey: string;
  tasks: TaskProps;
  status: TaskStatusType;
  likedTaskData: TaskDataProps[];
  disabled?: boolean;
  dailyWorkingHours?: number;
  totalTimeEntriesInHours?: number[];
  employee?: string;
  setSelectedTask?: (taskKey: string) => void;
}

export interface TimeOffRowProps extends Omit<
  BaseTimeOffRowProps,
  "timeOffEntries"
> {
  dates: string[];
  leaves: Array<LeaveProps>;
  holidayList: Array<string>;
  expectedHours: number;
}
