/**
 * Internal dependencies
 */
import type { NewTimesheetProps, TaskDataItemProps } from "@/types/timesheet";
import type { Action, TeamState } from "../types";

export type EmployeeTimesheetListProps = {
  callback?: () => void;
  startDateParam: string;
  setStartDateParam: React.Dispatch<React.SetStateAction<string>>;
  teamState: TeamState;
  dispatch: React.Dispatch<Action>;
};

export interface EmployeeTimesheetListItemProps {
  showCheckbox?: boolean;
  onCheckedChange?: (date: string, checked: boolean | string) => void;
  index: number;
  className?: string;
  isCheckboxChecked?: boolean;
  isCheckboxDisabled?: boolean;
  checkboxClassName?: string;
  date: string;
  totalHours: number;
  isTimeExtended: number;
  isHoliday: boolean;
  hasLeave?: boolean;
  holidayDescription?: string;
  isHalfDayLeave?: boolean;
  dailyWorkingHour?: number;
  tasks: Array<TaskDataItemProps>;
  employee: string;
  handleTimeChange: (data: NewTimesheetProps) => void;
  onTaskClick?: (name: string) => void;
  hourInputClassName?: string;
  taskClassName?: string;
}
