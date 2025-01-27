import { getFormatedDate, getUTCDateTime, normalizeDate } from "@next-pms/design-system";
import { DataProp } from "@/types/timesheet";

export interface TimesheetState {
  timesheet: {
    name: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    employee: string;
    project?: string;
  };
  dateRange: { start_date: string; end_date: string };

  data: DataProp;
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  isLeaveDialogOpen: boolean;
  weekDate: string;
}

export const isDateInRange = (
  date: string,
  startDate: string,
  endDate: string
) => {
  const targetDate = getUTCDateTime(normalizeDate(date));

  return (
    getUTCDateTime(startDate) <= targetDate &&
    targetDate <= getUTCDateTime(endDate)
  );
};

export const validateDate = (startDateParam:string,timesheet:TimesheetState) => {
  if (!startDateParam) {
    return true;
  }
  const date = getFormatedDate(normalizeDate(startDateParam));
  const timesheetData = timesheet.data?.data;
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
