import path from "path";
import fs from "fs";
import { getWeekdayName, getDateForWeekday, getFormattedDate } from "../utils/dateUtils";
import { getLeaves, getLeaveDetails, actOnLeave } from "../utils/api/leaveRequests";
import employeeTimesheetData from "../data/employee/timesheet.json";
import { readJSONFile } from "../utils/fileUtils";

// Load env variables
const empID = process.env.EMP_ID;

// Define file paths for shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json"); // File path of the employee timesheet data JSON file

// ------------------------------------------------------------------------------------------

/**
 * Updates employee timesheet data by dynamically setting date values for different test cases.
 * It modifies the JSON data with the current date values, associates it with the employee ID
 * and writes the updated data back to the file.
 *
 * Test Cases: TC13
 */
export const updateLeaveEntries = async () => {
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
 * Rejects stale leave entries from the shared employee timesheet data.
 *
 * This function reads leave entry data from a JSON file, retrieves the first matching
 * leave entry, and if found, rejects the leave request by applying the "Reject" action.
 *
 * Test Cases: TC13
 */
export const rejectLeaveEntries = async () => {
  const sharedEmployeeTimesheetData = await readJSONFile("../data/employee/shared-timesheet.json");
  const leaveEntries = [sharedEmployeeTimesheetData.TC13.payloadFilterLeaveEntry];

  for (const entry of leaveEntries) {
    const filteredLeaveEntry = await getLeaves(entry);
    const firstEntry = filteredLeaveEntry?.data?.[0] || {};

    if (firstEntry.name) {
      const leaveDetailsJSON = await getLeaveDetails(firstEntry.name);
      await actOnLeave({ action: "Reject", leaveDetails: leaveDetailsJSON.data });
    }
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Delete leave with help of Leave ID
 */
export const deleteLeave = (leaveID, role = "admin") => {
  return apiRequest(
    `/api/resource/Leave Application/${leaveID}`,
    {
      method: "DELETE",
    },
    role
  );
};
