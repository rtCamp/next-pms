/**
 * Internal dependencies
 */
import { getFormatedDate, normalizeDate } from "@next-pms/design-system";
import { isDateInRange } from "@/lib/utils";
import type { DataProp } from "@/types/timesheet";

/**
 * Merges existing timesheet data with new payload, ensuring no duplicate leaves and combining holidays and data.
 * @param existing The existing timesheet data to be merged with the new payload.
 * @param payload The new timesheet data that needs to be merged with the existing data.
 */
export const mergeTimesheetData = (
  existing: DataProp,
  payload: DataProp,
): DataProp => {
  const existingLeaveIds = new Set(existing.leaves.map((leave) => leave.name));
  const newLeaves = payload.leaves.filter(
    (leave) => !existingLeaveIds.has(leave.name),
  );

  return {
    ...existing,
    data: {
      ...existing.data,
      ...payload.data,
    },
    holidays: [...existing.holidays, ...payload.holidays],
    leaves: [...existing.leaves, ...newLeaves],
  };
};

/**
 * Validates if the provided start date falls within the range of the timesheet data's start and end dates.
 * @param startDateParam The start date to be validated.
 * @param timesheetData The timesheet data containing the date range for validation.
 */
export const validateDate = (
  startDateParam: string,
  timesheetData: DataProp,
) => {
  if (!startDateParam) {
    return true;
  }

  const date = getFormatedDate(normalizeDate(startDateParam));
  const weekData = timesheetData?.data;
  if (weekData && Object.keys(weekData).length > 0) {
    const keys = Object.keys(weekData);
    const firstObject = weekData[keys[0]];
    const lastObject = weekData[keys[keys.length - 1]];
    if (isDateInRange(date, lastObject.start_date, firstObject.end_date)) {
      return true;
    }
  }

  return false;
};
