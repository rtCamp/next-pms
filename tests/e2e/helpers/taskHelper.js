import path from "path";
import fs from "fs";
import { getWeekdayName, getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import { getTaskDetails, deleteTaskEndPoint } from "../utils/api/taskRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import managerTaskData from "../data/manager/task.json";
import { readJSONFile } from "../utils/fileUtils";

// Load env variables
//const empID = process.env.EMP_ID;

// Define file paths for shared JSON data files
const managerTaskDataFilePath = path.resolve(__dirname, "../data/manager/shared-task.json"); // File path of the manager task data JSON file

// Global variables to store shared data and reused across functions
let sharedManagerTaskData;

// ------------------------------------------------------------------------------------------

/**
 * Deletes stale task entries from the shared manager task data.
 *
 * This function reads task data from JSON files and iterates through predefined
 * Task entry objects, filtering each entry and deleting the corresponding task record.
 *
 * Test Cases: TC24
 */
export const deleteTasks = async () => {
  sharedManagerTaskData = await readJSONFile("../data/manager/task.json");

  const taskEntries = [sharedManagerTaskData.TC24.payloadFilterTimeEntry.subject];

  for (const entry of taskEntries) {
    const response = await getTaskDetails(entry);
    const jsonResponse = await response.json();
    const taskIDtoDelete = jsonResponse.message.task[0].name;
    await deleteTaskEndPoint(taskIDtoDelete);
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Filters timesheet entries and returns the metadata of the matching time entry.
 *
 * Optional params: start_date, max_week.
 */
export const filterTimesheetEntry = async ({ subject, description, project_name }) => {
  const payload = { subject, description, project_name };
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
