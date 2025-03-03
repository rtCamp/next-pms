import { getTimesheetDetails } from "../utils/api/timesheetRequests";

/**
 * Filters timesheet entries and returns the metadata of the matching time entry.
 * Optional params: start_date, max_week.
 */
export const filterTimesheetEntry = async ({ subject, description, project_name, from_time, employee, max_week }) => {
  const payload = { employee, start_date: from_time, max_week };
  const response = await getTimesheetDetails(payload);
  const jsonResponse = await response.json();
  const data = jsonResponse.message.data;

  // Iterate over all weeks
  for (const weekData of Object.values(data)) {
    // Extract and iterate over all tasks
    for (const taskMetaData of Object.values(weekData.tasks)) {
      if (taskMetaData.subject !== subject) continue;

      // Find the first matching entry
      const matchingEntry = taskMetaData.data.find(
        (entry) =>
          entry.description === description &&
          entry.project_name === project_name &&
          entry.from_time.includes(from_time)
      );

      // Return the matching entry
      if (matchingEntry) return matchingEntry;
    }
  }

  return {}; // Return empty object if no match is found
};
