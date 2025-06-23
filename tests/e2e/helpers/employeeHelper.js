import path from "path";
import { getFormattedDate, getYesterdayDate } from "../utils/dateUtils";
import managerTeamData from "../data/manager/team.json";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { addEmployee, deleteEmployee } from "../utils/api/employeeRequests";
import { deleteAllocation } from "../utils/api/projectRequests";
import { getRandomString } from "../utils/stringUtils";
import { filterApi } from "../utils/api/frappeRequests";

// Load env variables
const managerId = process.env.REP_MAN_ID;
const managerName = process.env.REP_MAN_NAME;
const managerMail = process.env.REP_MAN_EMAIL;
const employeeId = process.env.EMP3_ID;

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

      if (testCase?.payloadCreateEmployee) {
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

            /*
            When an Active employee is created, the employee name is
            stored into the TC39 and TC53 to handle test contamination
            */
            if (status === "Active") {
              const fullName = employeePayload.first_name + " " + employeePayload.last_name;
              if (!data["TC39"]?.employees.includes(fullName)) {
                data["TC39"].employees.push(fullName);
              }

              if (!data["TC53"]?.employees.includes(fullName)) {
                data["TC53"].employees.push(fullName);
              }
            }
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
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
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
          console.warn(`Deleted employee: ${emp.name}`);
        } catch (err) {
          console.warn(`Error deleting ${emp.name}: ${err.message}`);
        }
      }
    }
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Filter the employees by their first name: "Playwright-" and delete them
 */
export const deleteEmployeeByName = async () => {
  // Fetch Employees
  const employeeRes = await filterApi("Employee", [["Employee", "employee_name", "like", "Playwright-%"]], "admin");

  const employeeValues = employeeRes?.message?.values || [];

  let employeeIds = [];

  // Extract Employee IDs
  if (Array.isArray(employeeValues)) {
    employeeIds = employeeValues.flat().filter((v) => typeof v === "string");
  }

  if (employeeIds.length > 0) {
    console.warn(`Employees to delete: `, employeeIds);

    for (const empId of employeeIds) {
      try {
        const deleteRes = await deleteEmployee(empId, "admin");
        console.warn(`Deleted Employee: ${empId}`, deleteRes);
      } catch (error) {
        console.error(`Error deleting Employee: ${empId}`, error);
      }
    }
  } else {
    console.warn("No employees found with the given name to delete.");
  }
};

export const deleteAllocationsByEmployee = async (projectID, employeeID = employeeId) => {
  const filterResponse = await filterApi(
    "Resource Allocation",
    [
      ["Resource Allocation", "employee", "=", employeeID],
      ["Resource Allocation", "project", "=", projectID],
    ],
    "admin"
  );
  console.log(filterResponse.message?.values?.length);
  if (filterResponse.message?.values?.length > 0) {
    const allocations = filterResponse.message.values;
    for (const row of allocations) {
      const allocationName = row[0];
      console.log(`Deleting allocation: ${allocationName}`);
      try {
        await deleteAllocation(allocationName);
        console.log(`Deleted ${allocationName}`);
      } catch (error) {
        console.error(`Failed to delete ${allocationName}:`, error);
      }
    }
  }
};
