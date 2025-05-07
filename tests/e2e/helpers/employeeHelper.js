import path from "path";
import { getFormattedDate, getYesterdayDate } from "../utils/dateUtils";
import managerTeamData from "../data/manager/team.json";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { addEmployee, deleteEmployee } from "../utils/api/employeeRequests";
import { getRandomString } from "../utils/stringUtils";
// Load env variables
const managerId = process.env.REP_MAN_ID;
const managerName = process.env.REP_MAN_NAME;
const managerMail = process.env.REP_MAN_EMAIL;

// Define file paths for shared JSON data files
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file

// Global variables to store shared data and reused across functions
let sharedManagerTeamData;

// ------------------------------------------------------------------------------------------

/**
 * Create Employees of different status
 */
export const createEmployees = async () => {
  const managerTeamIDs = ["TC91"];
  const employeeStatuses = ["Active", "Inactive", "Suspended", "Left"];

  const processTestCasesForEmployee = async (data, empStatuses, testCases) => {
    for (const testCaseID of testCases) {
      const testCase = data[testCaseID];

      if (testCase.payloadCreateEmployee) {
        const basePayload = testCase.payloadCreateEmployee;
        testCase.createdEmployees = [];

        for (const status of empStatuses) {
          const randomString = getRandomString(5);

          // Clone the payload to avoid mutation
          const employeePayload = {
            ...basePayload,
            last_name: status + randomString,
            status: status,
            date_of_joining: getYesterdayDate(),
            custom_reporting_manager: managerName,
            reports_to: managerId,
            leave_approver: managerMail,
          };

          // Add relieving_date if status is "Left"
          if (status === "Left") {
            const today = new Date();
            employeePayload.relieving_date = getFormattedDate(today);
          }

          try {
            const response = await addEmployee(employeePayload, "admin");

            // Store the full created employee info along with response `name`
            testCase.createdEmployees.push({
              ...employeePayload,
              name: response.data.name,
            });

            console.log(
              `Employee ID for added employee of test case ${testCaseID} with status ${status}:`,
              response.data.name
            );
          } catch (error) {
            console.error(`Error creating employee for test case ${testCaseID} with status ${status}:`, error);
          }
        }
      }
    }
  };

  await processTestCasesForEmployee(managerTeamData, employeeStatuses, managerTeamIDs);
  writeDataToFile(managerTeamDataFilePath, managerTeamData);
};
// ------------------------------------------------------------------------------------------

/**
 * Delete the employee created in global setup
 */
export const deleteEmployees = async () => {
  sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");
  const managerTeamIDs = ["TC91"];

  for (const teamID of managerTeamIDs) {
    const teamData = sharedManagerTeamData[teamID];
    if (!teamData || !Array.isArray(teamData.createdEmployees)) continue;

    for (const emp of teamData.createdEmployees) {
      if (emp.name) {
        try {
          //Delete employee
          await deleteEmployee(emp.name, "admin");
          console.log(`Deleted employee: ${emp.name}`);
        } catch (err) {
          console.error(`Error deleting ${emp.name}: ${err.message}`);
        }
      }
    }
  }
};
