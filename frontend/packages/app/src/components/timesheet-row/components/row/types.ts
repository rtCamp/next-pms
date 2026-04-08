/**
 * External dependencies.
 */
import type {
  HeaderRowProps as BaseHeaderRowProps,
  WeekRowProps as BaseWeekRowProps,
  MemberRowProps as BaseMemberRowProps,
  TotalRowProps as BaseTotalRowProps,
  ProjectRowProps as BaseProjectRowProps,
  TaskRowProps as BaseTaskRowProps,
  TimeOffRowProps as BaseTimeOffRowProps,
  ApprovalStatusType,
  TotalHoursTheme,
  ApprovalStatusLabelType,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";

export interface HeaderRowProps extends Omit<BaseHeaderRowProps, "days"> {
  dates: string[];
  showHeading: boolean;
}

interface WeekRowBaseProps extends Omit<BaseWeekRowProps, "status"> {
  dates: string[];
  children?: (props: {
    totalHours: string;
    totalHoursTheme: TotalHoursTheme;
    totalTimeEntries: { date: string; time: string }[];
    totalTimeEntriesInHours: number[];
    dailyWorkingHours: number;
    status: ApprovalStatusType;
  }) => React.ReactNode;
  approvalPendingCount?: number;
}

type ReadOnlyWeekRowProps = WeekRowBaseProps & {
  isReadOnlyWeek: true;
  tasks?: TaskProps;
  leaves?: Array<LeaveProps>;
  holidays?: Array<HolidayProp>;
  workingHour?: number;
  workingFrequency?: WorkingFrequency;
  status?: ApprovalStatusLabelType;
};

type EditableWeekRowProps = WeekRowBaseProps & {
  isReadOnlyWeek?: false | undefined;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  holidays: Array<HolidayProp>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  status: ApprovalStatusLabelType;
};

export type WeekRowProps = ReadOnlyWeekRowProps | EditableWeekRowProps;

export interface MemberRowProps extends Omit<
  BaseMemberRowProps,
  "status" | "timeEntries"
> {
  dates: string[];
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  holidays: Array<HolidayProp>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  status: ApprovalStatusLabelType;
  children?: (props: {
    totalTimeEntriesInHours: number[];
    dailyWorkingHours: number;
  }) => React.ReactNode;
}

export type TotalRowProps = BaseTotalRowProps;

export interface ProjectRowProps extends Omit<
  BaseProjectRowProps,
  "timeEntries"
> {
  dates: string[];
  tasks: TaskProps;
  hideTime?: boolean;
  children?: React.ReactNode;
}

export interface TaskRowProps extends Omit<
  BaseTaskRowProps,
  "timeEntries" | "status" | "onCellClick"
> {
  dates: string[];
  taskKey: string;
  tasks: TaskProps;
  status: string;
  disabled?: boolean;
  dailyWorkingHours?: number;
  totalTimeEntriesInHours?: number[];
  employee?: string;
  hideLikeButton?: boolean;
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
