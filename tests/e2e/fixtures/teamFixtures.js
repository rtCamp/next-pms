import { test as baseTest } from "@playwright/test";
import path from "path";
import { addEmployee, deleteEmployee } from "../utils/api/employeeRequests.js";
import { getYesterdayDate, getFormattedDate } from "../utils/dateUtils.js";
import { getRandomString } from "../utils/stringUtils.js";
import initialTeamData from "../data/manager/team.js";
import { writeDataToFile } from "../utils/fileUtils.js";

// Define file paths for shared JSON data files
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json");

export const test = baseTest.extend({
  // override testCaseIDs (default = empty array, optional)
  testCaseIDs: [[], { option: true }],

  // define teamData as a function fixture
  teamData: async ({ testCaseIDs }, use) => {
    console.log("🔥 teamData fixture running");
    console.log("  requested IDs:", testCaseIDs);

    const teamData = JSON.parse(JSON.stringify(initialTeamData));
    if (!testCaseIDs || testCaseIDs.length === 0) {
      console.log("No IDs provided, skipping creation");
      await use(teamData);
      return;
    }

    for (const id of testCaseIDs) {
      const tc = teamData[id];
      tc.createdEmployees = [];
      if (!tc.payloadCreateEmployee) continue;

      for (const status of ["Active", "Inactive", "Suspended", "Left"]) {
        const suffix = getRandomString(5);
        const payload = {
          ...tc.payloadCreateEmployee,
          last_name: status + suffix,
          status,
          date_of_joining: getYesterdayDate(),
          custom_reporting_manager: process.env.REP_MAN_NAME,
          reports_to: process.env.REP_MAN_ID,
          leave_approver: process.env.REP_MAN_EMAIL,
        };
        if (status === "Left") {
          payload.relieving_date = getFormattedDate(new Date());
        }

        try {
          const response = await addEmployee(payload, "admin");

          if (status === "Active") {
            const fullName = payload.first_name + " " + payload.last_name;
            if (!teamData["TC39"]?.employees.includes(fullName)) {
              teamData["TC39"].employees.push(fullName);
            }
            if (teamData["TC53"]) {
              if (!teamData["TC53"].employeesInQE.includes(fullName)) {
                teamData["TC53"].employeesInQE.push(fullName);
              }
              if (!teamData["TC53"].employeesInStaging.includes(fullName)) {
                teamData["TC53"].employeesInStaging.push(fullName);
              }
            }
          }

          tc.createdEmployees.push({ ...payload, name: response.data.name });

          console.log(
            `✅ Employee ID for added employee of test case ${id} with status ${status}:`,
            response.data.name
          );
        } catch (error) {
          console.error(`❌ Error creating employee for test case ${id} with status ${status}:`, error);
        }
      }
    }

    await writeDataToFile(managerTeamDataFilePath, teamData);

    await use(teamData);

    // Teardown: delete only what we created
    for (const id of testCaseIDs) {
      const tc = teamData[id];
      if (!Array.isArray(tc.createdEmployees)) continue;

      for (const emp of tc.createdEmployees) {
        try {
          await deleteEmployee(emp.name, "admin");
        } catch (e) {
          console.warn(`Failed to delete ${emp.name}:`, e);
        }
      }
    }
  },
});

export const expect = test.expect;
