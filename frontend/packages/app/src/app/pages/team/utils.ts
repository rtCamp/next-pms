import {
  getFormatedDate,
  normalizeDate,
} from "@next-pms/design-system";
import { isDateInRange } from "@/lib/utils";
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
