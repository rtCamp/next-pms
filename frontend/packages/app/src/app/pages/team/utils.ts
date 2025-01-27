import {
  getFormatedDate,
  getUTCDateTime,
  normalizeDate,
} from "@next-pms/design-system";
import { TeamState } from "./reducer";

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
