import { test as baseTest } from "@playwright/test";
import path from "path";
import initialEmployeeTimesheetData from "../data/employee/timesheet.js";
import initialManagerTeamData from "../data/manager/team.js";
import { writeDataToFile, readJSONFile } from "../utils/fileUtils.js";
import { createTimesheet, deleteTimesheet } from "../utils/api/timesheetRequests.js";
import { filterTimesheetEntry } from "../helpers/timesheetHelper.js";
import { getWeekdayName, getFormattedDate, getDateForWeekday } from "../utils/dateUtils.js";

// Paths to shared JSON data files
const employeeTimesheetDataFilePath = path.resolve(__dirname, "../data/employee/shared-timesheet.json");
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json");

export const test = baseTest.extend({
  // Override testCaseIDs (default = empty array)
  testCaseIDs: [[], { option: true }],

  timeEntryData: async ({ testCaseIDs }, use) => {
    // Deep clone initial data
    const employeeData = JSON.parse(JSON.stringify(initialEmployeeTimesheetData));
    const managerData = JSON.parse(JSON.stringify(initialManagerTeamData));

    // Helper for updateTimeEntries logic
    const updateEntries = (data, testCases) => {
      for (const id of testCases) {
        const tc = data[id];
        if (!tc || !tc.cell || !tc.cell.col) continue;
        const formattedDate = getFormattedDate(getDateForWeekday(tc.cell.col));
        // Choose employee ID from env variables
        const empID = process.env.EMP_ID;
        const emp2ID = process.env.EMP2_ID;
        const emp3ID = process.env.EMP3_ID;
        const tcEmp3 = new Set(["TC92"]);
        const tcEmp2 = new Set(["TC2"]);
        const employeeID = tcEmp3.has(id) ? emp3ID : tcEmp2.has(id) ? emp2ID : empID;
        // Update payloadCreateTimesheet
        if (tc.payloadCreateTimesheet) {
          tc.payloadCreateTimesheet.date = formattedDate;
          tc.payloadCreateTimesheet.employee = employeeID;
        }
        // Update any payloadFilterTimeEntry*
        Object.keys(tc)
          .filter((key) => key.startsWith("payloadFilterTimeEntry"))
          .forEach((key) => {
            tc[key].from_time = formattedDate;
            tc[key].employee = employeeID;
          });
      }
    };

    // Split IDs for update
    const employeeIDs = testCaseIDs.filter((id) => id in employeeData);
    const managerIDs = testCaseIDs.filter((id) => id in managerData);

    // 1. Update entries
    // Ensure TC2 cell.col set to weekday
    if (employeeData.TC2) {
      employeeData.TC2.cell.col = getWeekdayName(new Date());
    }
    updateEntries(employeeData, employeeIDs);
    updateEntries(managerData, managerIDs);
    // Persist updates
    await writeDataToFile(employeeTimesheetDataFilePath, employeeData);
    await writeDataToFile(managerTeamDataFilePath, managerData);

    // 2. Create timesheet entries
    const sharedEmployee = await readJSONFile(employeeTimesheetDataFilePath);
    const sharedManager = await readJSONFile(managerTeamDataFilePath);
    // Gather createTimesheet payloads
    const createPayloads = [];
    for (const id of testCaseIDs) {
      const tcE = sharedEmployee[id]?.payloadCreateTimesheet;
      const tcM = sharedManager[id]?.payloadCreateTimesheet;
      if (tcE) createPayloads.push(tcE);
      if (tcM) createPayloads.push(tcM);
    }
    for (const payload of createPayloads) {
      await createTimesheet(payload);
    }

    // Expose updated data if tests need it
    await use({ employeeData, managerData });

    // Teardown: delete timesheet entries
    const reloadEmployee = await readJSONFile(employeeTimesheetDataFilePath);
    const reloadManager = await readJSONFile(managerTeamDataFilePath);
    const deletePayloads = [];
    for (const id of testCaseIDs) {
      const ftE = reloadEmployee[id]?.payloadFilterTimeEntry;
      const ftE1 = reloadEmployee[id]?.payloadFilterTimeEntry1;
      const ftE2 = reloadEmployee[id]?.payloadFilterTimeEntry2;
      const ftM = reloadManager[id]?.payloadFilterTimeEntry;
      [ftE, ftE1, ftE2, ftM].forEach((entry) => {
        if (entry) deletePayloads.push(entry);
      });
    }
    for (const entry of deletePayloads) {
      const filtered = await filterTimesheetEntry(entry);
      await deleteTimesheet({ parent: filtered.parent, name: filtered.name });
    }
  },
});

export const expect = test.expect;
