/**
 * Internal dependencies
 */
import type { DataProp } from "@/types/timesheet";
import { formatTimesheetWeekLabel, replaceLeavesForWeeks } from "../utils";

/**
 * Merges existing timesheet data with new payload, combining holidays and data.
 * The payload is authoritative for the leaves of the weeks it covers, so leaves
 * cancelled or deleted on the server are dropped from the merged result.
 * @param existing The existing timesheet data to be merged with the new payload.
 * @param payload The new timesheet data that needs to be merged with the existing data.
 */
export const mergeTimesheetData = (
  existing: DataProp,
  payload: DataProp,
): DataProp => {
  return {
    ...existing,
    data: {
      ...existing.data,
      ...payload.data,
    },
    holidays: [...existing.holidays, ...payload.holidays],
    leaves: replaceLeavesForWeeks(
      existing.leaves,
      payload.leaves,
      Object.values(payload.data),
    ),
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
