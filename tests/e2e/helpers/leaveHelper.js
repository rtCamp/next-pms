import path from "path";
import fs from "fs";
import { getWeekdayName, getDateForWeekday, getFormattedDate } from "../utils/dateUtils";
import { getLeaves, getLeaveDetails, actOnLeave } from "../utils/api/leaveRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import { readJSONFile } from "../utils/fileUtils";

// Load env variables
const empID = process.env.EMP_ID;

// ------------------------------------------------------------------------------------------

/**
 * Updates employee timesheet data by dynamically setting date values for different test cases.
 * It modifies the JSON data with the current date values, associates it with the employee ID
 * and writes the updated data back to the file.
 * Test Cases: TC13
 */
export const updateInitialLeaveEntries = async () => {
  const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file

  // Update TC13 dynamic fields
  employeeTimesheetData.TC13.cell.col = getWeekdayName(new Date()); // Get today's weekday name
  var formattedDate = getFormattedDate(getDateForWeekday(employeeTimesheetData.TC13.cell.col));

  employeeTimesheetData.TC13.payloadFilterLeaveEntry.from_date = formattedDate;
  employeeTimesheetData.TC13.payloadFilterLeaveEntry.to_date = formattedDate;
  employeeTimesheetData.TC13.payloadFilterLeaveEntry.employee = empID;

  // Write back updated JSON
  fs.writeFileSync(employeeTimesheetDataFilePath, JSON.stringify(employeeTimesheetData, null, 2));
};

/**
 * Deletes stale leave entries from the timesheet data.
 * Uses `getLeaves` to retrieve existing leave entries.
 * Uses `getLeaveDetails` to retrieve leave details.
 * Calls `actOnLeave` to reject the leave application.
 * Test Cases: TC13
 */
export const rejectStaleLeaveEntries = async () => {
  const sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");

  // Fetch TC13 leave entry and reject leave entry
  const filteredLeaveEntry = await getLeaves(sharedEmployeeTimesheetData.TC13.payloadFilterLeaveEntry);
  const filteredLeaveEntryJSON = await filteredLeaveEntry.json();
  const firstEntry = filteredLeaveEntryJSON?.data?.[0] || {};

  const leaveDetails = await getLeaveDetails(firstEntry.name);
  const leaveDetailsJSON = await leaveDetails.json();

  await actOnLeave({ action: "Reject", leaveDetails: leaveDetailsJSON.data });
};
