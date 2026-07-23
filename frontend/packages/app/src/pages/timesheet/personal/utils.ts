/**
 * Internal dependencies
 */
import type { DataProp } from "@/types/timesheet";
import { formatTimesheetWeekLabel } from "../utils";

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
 * Adds a display label to each week while preserving the original data keys.
 * @param payload The personal timesheet payload whose week entries need labels.
 * @param referenceDate Optional date used to resolve relative labels like "This Week".
 */
export const addWeekLabels = (
  payload: DataProp,
  referenceDate?: string,
): DataProp => {
  const weeksWithLabels = Object.entries(payload.data).reduce<DataProp["data"]>(
    (acc, [key, week]) => {
      acc[key] = {
        ...week,
        label: formatTimesheetWeekLabel(
          week.start_date,
          week.end_date,
          referenceDate,
        ),
      };
      return acc;
    },
    {},
  );

  return {
    ...payload,
    data: weeksWithLabels,
  };
};
