import {
  getDateFromDateAndTimeString,
  getFormatedDate,
  normalizeDate,
} from "@next-pms/design-system";
import { isDateInRange } from "@/lib/utils";
import {
  TaskDataItemProps,
  TaskDataProps,
  TaskProps,
  HolidayProp,
  LeaveProps,
} from "@/types/timesheet";
import { TeamState } from "./reducer";

export const validateDate = (startDateParam: string, teamState: TeamState) => {
  if (!startDateParam) {
    return true;
  }
  const date = getFormatedDate(normalizeDate(startDateParam));
  const timesheetData = teamState.timesheetData.data;
  if (timesheetData && Object.keys(timesheetData).length > 0) {
    const keys = Object.keys(timesheetData);
    const firstObject = timesheetData[keys[0]];
    const lastObject = timesheetData[keys[keys.length - 1]];
    if (isDateInRange(date, lastObject.start_date, firstObject.end_date)) {
      return true;
    }
  }

  return false;
};

export const getTaskDataForDate = (tasks: TaskProps, date: string) => {
  const data = Object.entries(tasks).flatMap(
    ([, task]: [string, TaskDataProps]) =>
      task.data
        .filter(
          (taskItem: TaskDataItemProps) =>
            getDateFromDateAndTimeString(taskItem.from_time) === date
        )
        .map((taskItem: TaskDataItemProps) => ({
          ...taskItem,
          subject: task.subject,
          project_name: task.project_name,
        }))
  );
  return data;
};

export const getTimesheetHourForDate = (
  date: string,
  tasks: Array<TaskDataItemProps>,
  holidays: Array<HolidayProp>,
  leaves: Array<LeaveProps>,
  dailyWorkingHour: number
) => {
  let totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
  const holiday = holidays.find(
    (holiday) => typeof holiday !== "string" && holiday.holiday_date === date
  );
  const isHoliday = !!holiday;
  const leave = leaves.filter((data: LeaveProps) => {
    return date >= data.from_date && date <= data.to_date;
  });

  let isHalfDayLeave = false;
  if (leave.length > 0 && !isHoliday) {
    leave.forEach((data: LeaveProps) => {
      isHalfDayLeave = data.half_day && data.half_day_date == date;
      if (isHalfDayLeave) {
        totalHours += dailyWorkingHour / 2;
      } else {
        totalHours += dailyWorkingHour;
      }
    });
  }
  return {
    totalHours,
    isHalfDayLeave,
    isHoliday,
    holidayDescription: holiday?.description,
    hasLeave: leave.length > 0,
  };
};
