import { readdir } from "fs/promises";
import path from "path";
import { getFormattedDate, getYesterdayDate } from "../utils/dateUtils";
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

// ------------------------------------------------------------------------------------------

/**
 * Create Employees for each test case ID
 * Writes each test-case's data into its corresponding TC.json under data/json-files
 * @param {string[]} testCaseIDs
 */
export const createEmployees = async (testCaseIDs, jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;
  const employeeStatuses = ["Active", "Inactive", "Suspended", "Left"];
  const [tcId] = testCaseIDs;

  // Load primary test‑case stub
  const stubPath = path.join(jsonDir, `${tcId}.json`);
  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry || !entry.payloadCreateEmployee) {
    console.warn(`⚠️ No payloadCreateEmployee for ${tcId}`);
    return;
  }
  entry.createdEmployees = [];

  // Discover side files in the folder
  const allFiles = await readdir(jsonDir);
  const sideFiles = allFiles.filter((f) => f === "TC39.json" || f === "TC53.json");

  // Load side files into memory
  const sideData = {};
  for (const fileName of sideFiles) {
    const fullPath = path.join(jsonDir, fileName);
    sideData[fileName] = await readJSONFile(fullPath);
  }

  // Process each employee status
  for (const status of employeeStatuses) {
    const payload = {
      ...JSON.parse(JSON.stringify(entry.payloadCreateEmployee)),
      last_name: `${status}${getRandomString(5)}`,
      status,
      date_of_joining: getYesterdayDate(),
      custom_reporting_manager: managerName,
      reports_to: managerId,
      leave_approver: managerMail,
      ...(status === "Left" && { relieving_date: getFormattedDate(new Date()) }),
    };

    try {
      const res = await addEmployee(payload, "admin");
      const fullName = `${payload.first_name} ${payload.last_name}`;

      // If Active, update TC39/TC53 in‑memory
      if (status === "Active") {
        if (sideData["TC39.json"]) {
          const arr = (sideData["TC39.json"].TC39.employees ||= []);
          if (!arr.includes(fullName)) arr.push(fullName);
        }
        if (sideData["TC53.json"]) {
          const data53 = sideData["TC53.json"].TC53;
          const inQE = (data53.employeesInQE ||= []);
          const inStg = (data53.employeesInStaging ||= []);
          if (!inQE.includes(fullName)) inQE.push(fullName);
          if (!inStg.includes(fullName)) inStg.push(fullName);
        }
      }

      entry.createdEmployees.push({ ...payload, name: res.data.name });
    } catch (err) {
      console.error(`❌ Error creating ${status} for ${tcId}:`, err);
    }
  }

  // Write back primary stub
  await writeDataToFile(stubPath, { [tcId]: entry });
  const verify = await readJSONFile(stubPath);
  //console.log("✅ Verified from disk:");

  console.dir(verify, { depth: null, colors: true });
  // Write back any side files that were loaded
  for (const fileName of sideFiles) {
    const fullPath = path.join(jsonDir, fileName);
    await writeDataToFile(fullPath, sideData[fileName]);
  }
  console.log("✅ Completed create Employee for ", testCaseIDs);
};
// ------------------------------------------------------------------------------------------

/**
 * Delete Employees created for each test case ID
 * @param {string[]} testCaseIDs
 */
export async function deleteEmployees(testCaseID, jsonDir) {
  // Path to this test's JSON file
  const filePath = path.join(jsonDir, `${testCaseID}.json`);
  let testCase;

  try {
    testCase = await readJSONFile(filePath);
  } catch (err) {
    console.warn(`⚠️ Could not read JSON for ${testCaseID} in createEmployees function: ${err.message}`);
    return;
  }
  if (!testCase || !Array.isArray(testCase.createdEmployees)) {
    console.warn(`⚠️ No createdEmployees array found in ${filePath}`);
    return;
  }
  for (const emp of testCase.createdEmployees) {
    if (!emp.name) continue;
    try {
      await deleteEmployee(emp.name, "admin");
      //console.log(`🗑 Deleted ${emp.name} for ${testCaseID}`);
    } catch (err) {
      console.warn(`⚠️ Failed to delete ${emp.name} for ${testCaseID}: ${err.message}`);
    }
  }
}
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
// ------------------------------------------------------------------------------------------

export const deleteAllocationsByEmployee = async (projectID, employeeID = employeeId) => {
  const filterResponse = await filterApi(
    "Resource Allocation",
    [
      ["Resource Allocation", "employee", "=", employeeID],
      ["Resource Allocation", "project", "=", projectID],
    ],
    "admin"
  );
  //console.log(filterResponse.message?.values?.length);
  if (filterResponse.message?.values?.length > 0) {
    const allocations = filterResponse.message.values;
    for (const row of allocations) {
      const allocationName = row[0];
      //console.log(`Deleting allocation: ${allocationName}`);
      try {
        await deleteAllocation(allocationName);
        //console.log(`Deleted ${allocationName}`);
      } catch (error) {
        console.error(`Failed to delete ${allocationName}:`, error);
      }
    }
  }
};
