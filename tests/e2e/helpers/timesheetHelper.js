import path from "path";
import fs from "fs";
import { getWeekdayName, getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import { createTimesheet, getTimesheetDetails, deleteTimesheet } from "../utils/api/timesheetRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import managerTeamData from "../data/manager/team.json";
import { readJSONFile } from "../utils/fileUtils";

// Load env variables
const empID = process.env.EMP_ID;

// ------------------------------------------------------------------------------------------

/**
 * Updates employee timesheet data by dynamically setting date values for different test cases.
 * It modifies the JSON data with the current date values, associates it with the employee ID,
 * and creates time entries for specific test cases. Finally, it writes the updated data back to the file.
 *
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC45, TC47
 */
export const createInitialTimeEntries = async () => {
  const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file
  const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file

  var formattedDate;

  // Fetch TC2 task and update dynamic fields
  employeeTimesheetData.TC2.cell.col = getWeekdayName(new Date()); // Get today's weekday name

  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC2.cell.col));

  employeeTimesheetData.TC2.payloadFilterTimeEntry.from_time = formattedDate;
  employeeTimesheetData.TC2.payloadFilterTimeEntry.employee = empID;

  // Fetch TC3 task and update dynamic fields
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC3.cell.col));

  employeeTimesheetData.TC3.payloadFilterTimeEntry.from_time = formattedDate;
  employeeTimesheetData.TC3.payloadFilterTimeEntry.employee = empID;

  // Fetch TC4 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC4.cell.col));

  employeeTimesheetData.TC4.payloadCreateTimesheet.date = formattedDate;
  employeeTimesheetData.TC4.payloadCreateTimesheet.employee = empID;
  employeeTimesheetData.TC4.payloadFilterTimeEntry1.from_time = formattedDate;
  employeeTimesheetData.TC4.payloadFilterTimeEntry1.employee = empID;
  employeeTimesheetData.TC4.payloadFilterTimeEntry2.from_time = formattedDate;
  employeeTimesheetData.TC4.payloadFilterTimeEntry2.employee = empID;

  await createTimesheet(employeeTimesheetData.TC4.payloadCreateTimesheet);

  // Fetch TC5 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC5.cell.col));

  employeeTimesheetData.TC5.payloadCreateTimesheet.date = formattedDate;
  employeeTimesheetData.TC5.payloadCreateTimesheet.employee = empID;
  employeeTimesheetData.TC5.payloadFilterTimeEntry1.from_time = formattedDate;
  employeeTimesheetData.TC5.payloadFilterTimeEntry1.employee = empID;
  employeeTimesheetData.TC5.payloadFilterTimeEntry2.from_time = formattedDate;
  employeeTimesheetData.TC5.payloadFilterTimeEntry2.employee = empID;

  await createTimesheet(employeeTimesheetData.TC5.payloadCreateTimesheet);

  // Fetch TC6 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC6.cell.col));

  employeeTimesheetData.TC6.payloadCreateTimesheet.date = formattedDate;
  employeeTimesheetData.TC6.payloadCreateTimesheet.employee = empID;
  employeeTimesheetData.TC6.payloadFilterTimeEntry.from_time = formattedDate;
  employeeTimesheetData.TC6.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(employeeTimesheetData.TC6.payloadCreateTimesheet);

  // Fetch TC7 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC7.cell.col));

  employeeTimesheetData.TC7.payloadCreateTimesheet.date = formattedDate;
  employeeTimesheetData.TC7.payloadCreateTimesheet.employee = empID;
  employeeTimesheetData.TC7.payloadFilterTimeEntry.from_time = formattedDate;
  employeeTimesheetData.TC7.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(employeeTimesheetData.TC7.payloadCreateTimesheet);

  // Fetch TC14 task and update dynamic fields
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC14.cell.col));

  employeeTimesheetData.TC14.payloadCreateTimesheet.date = formattedDate;
  employeeTimesheetData.TC14.payloadCreateTimesheet.employee = empID;
  employeeTimesheetData.TC14.payloadFilterTimeEntry.from_time = formattedDate;
  employeeTimesheetData.TC14.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(employeeTimesheetData.TC14.payloadCreateTimesheet);

  // Fetch TC15 task and update dynamic fields
  formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC15.cell.col));

  employeeTimesheetData.TC15.payloadCreateTimesheet.date = formattedDate;
  employeeTimesheetData.TC15.payloadCreateTimesheet.employee = empID;
  employeeTimesheetData.TC15.payloadFilterTimeEntry.from_time = formattedDate;
  employeeTimesheetData.TC15.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(employeeTimesheetData.TC15.payloadCreateTimesheet);

  // Fetch TC45 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(managerTeamData.TC45.cell.col));

  managerTeamData.TC45.payloadCreateTimesheet.date = formattedDate;
  managerTeamData.TC45.payloadCreateTimesheet.employee = empID;
  managerTeamData.TC45.payloadFilterTimeEntry.from_time = formattedDate;
  managerTeamData.TC45.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(managerTeamData.TC45.payloadCreateTimesheet);

  // Fetch TC47 task, update dynamic fields and create time entry
  formattedDate = getFormattedDate(getDateForWeekday(managerTeamData.TC47.cell.col));

  managerTeamData.TC47.payloadCreateTimesheet.date = formattedDate;
  managerTeamData.TC47.payloadCreateTimesheet.employee = empID;
  managerTeamData.TC47.payloadFilterTimeEntry.from_time = formattedDate;
  managerTeamData.TC47.payloadFilterTimeEntry.employee = empID;

  await createTimesheet(managerTeamData.TC47.payloadCreateTimesheet);

  // Write back updated JSON
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(employeeTimesheetData, null, 2));
  fs.writeFileSync(managerTeamDataFilePath, JSON.stringify(managerTeamData, null, 2));
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes stale time entries from the shared employee and manager timesheet data.
 *
 * This function reads timesheet data from JSON files and iterates through predefined
 * time entry objects, filtering each entry and deleting the corresponding timesheet record.
 *
 * Test Cases: TC2, TC3, TC4, TC5, TC6, TC7, TC14, TC15, TC45, TC47
 */
export const deleteStaleTimeEntries = async () => {
  const sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  const sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");
  const timeEntries = [
    sharedEmployeeTimesheetData.TC2.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC3.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC4.payloadFilterTimeEntry1,
    sharedEmployeeTimesheetData.TC4.payloadFilterTimeEntry2,
    sharedEmployeeTimesheetData.TC5.payloadFilterTimeEntry1,
    sharedEmployeeTimesheetData.TC5.payloadFilterTimeEntry2,
    sharedEmployeeTimesheetData.TC6.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC7.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC14.payloadFilterTimeEntry,
    sharedEmployeeTimesheetData.TC15.payloadFilterTimeEntry,
    sharedManagerTeamData.TC45.payloadFilterTimeEntry,
    sharedManagerTeamData.TC47.payloadFilterTimeEntry,
  ];

  for (const entry of timeEntries) {
    const filteredTimeEntry = await filterTimesheetEntry(entry);
    await deleteTimesheet({ parent: filteredTimeEntry.parent, name: filteredTimeEntry.name });
  }
};

// ------------------------------------------------------------------------------------------

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
