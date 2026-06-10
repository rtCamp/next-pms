/**
 * Internal dependencies
 */
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
