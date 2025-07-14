import path from "path";
import fs from "fs";
import { getFormattedDate, getYesterdayDate } from "../utils/dateUtils";
//import teamTemplate from "../data/manager/team";
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
 * Create Employees for each test case ID
 * param {string[]} testCaseIDs
 */
// helpers/employeeHelper.js

/**
 * Create Employees for each test case ID
 * Writes each test-case's data into its corresponding TC.json under data/json-files
 * @param {string[]} testCaseIDs
 */
// Define your statuses

export const createEmployees = async (testCaseIDs,jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;
  const employeeStatuses = ["Active", "Inactive", "Suspended", "Left"];

  const [tcId] = testCaseIDs;

  //const stubPath = path.resolve(__dirname, "../data/json-files", `${tcId}.json`);
  const stubPath = path.join(jsonDir, `${tcId}.json`);
  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];

  if (!entry || !entry.payloadCreateEmployee) {
    console.warn(`⚠️ No payloadCreateEmployee for ${tcId}`);
    return;
  }

  entry.createdEmployees = [];

  for (const status of employeeStatuses) {
    const payload = {
      ...JSON.parse(JSON.stringify(entry.payloadCreateEmployee)), // deep clone
      last_name: `${status}${getRandomString(5)}`,
      status,
      date_of_joining: getYesterdayDate(),
      custom_reporting_manager: managerName,
      reports_to: managerId,
      leave_approver: managerMail,
      ...(status === "Left" && {
        relieving_date: getFormattedDate(new Date()),
      }),
    };

    try {
      const res = await addEmployee(payload, "admin");
      entry.createdEmployees.push({ ...payload, name: res.data.name });
      //console.log(`✅ Created [${status}] ${res.data.name} for ${tcId}`);
    } catch (err) {
      console.error(`❌ Error creating ${status} for ${tcId}:`, err);
    }
  }

  // 🔍 Debug print before writing
  //console.log(`📝 Writing updated entry for ${tcId}:`);
  console.dir({ [tcId]: entry }, { depth: null, colors: true });

  await writeDataToFile(stubPath, { [tcId]: entry });
  const verify = await readJSONFile(stubPath);
  //console.log("✅ Verified from disk:");
  console.dir(verify, { depth: null, colors: true });
};

/*
export async function createEmployees(testCaseIDs = []) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const statuses = ["Active", "Inactive", "Suspended", "Left"];
  const relDir = "../data/json-files";

  // We'll collect all (absPath, fullStub) pairs here,
  // then flush them to disk after the loop.
  const writes = [];

  for (const tcId of testCaseIDs) {
    // 1) Build paths
    const stubRelPath = path.join(relDir, `${tcId}.json`);
    const absPath = path.resolve(__dirname, stubRelPath);

    // 2) Read the existing JSON stub
    let fullStub;
    try {
      fullStub = await readJSONFile(stubRelPath);
    } catch (err) {
      console.warn(`⚠️ Could not read stub for ${tcId}: ${err.message}`);
      continue;
    }

    const entry = fullStub[tcId];
    if (!entry || !entry.payloadCreateEmployee) {
      console.warn(`⚠️ No payloadCreateEmployee in ${tcId}.json — skipping`);
      continue;
    }

    // 3) Prepare or preserve createdEmployees
    entry.createdEmployees = entry.createdEmployees || [];

    // 4) Create your employees
    for (const status of statuses) {
      const randomStr = getRandomString(5);
      const payload = {
        ...entry.payloadCreateEmployee,
        last_name: status + randomStr,
        status,
        date_of_joining: getYesterdayDate(),
        custom_reporting_manager: managerName,
        reports_to: managerId,
        leave_approver: managerMail,
        ...(status === "Left" && { relieving_date: getFormattedDate(new Date()) }),
      };

      try {
        const res = await addEmployee(payload, "admin");
        const empName = res.data.name;
        entry.createdEmployees.push({ ...payload, name: empName });
        //console.log(`✅ Created [${status}] ${empName} for ${tcId}`);
      } catch (err) {
        console.error(`❌ Error creating ${status} for ${tcId}: ${err.message}`);
      }
    }

    // 5) Stage this updated stub for writing later
    fullStub[tcId] = entry;
    writes.push({ absPath, fullStub });
  }

  // --- now that the loop is done, flush all writes ---
  for (const { absPath, fullStub } of writes) {
    try {
      await writeDataToFile(absPath, fullStub);
      const tc = Object.keys(fullStub)[0];
      //console.log(`✏️  Persisted ${fullStub[tc].createdEmployees.length} employees in ${absPath}`);
    } catch (err) {
      console.warn(`⚠️ Failed to write ${absPath}: ${err.message}`);
    }
  }
}
*/
/*
export async function createEmployees(testCaseIDs = []) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const statuses = ["Active", "Inactive", "Suspended", "Left"];
  const relDir = "../data/json-files";

  for (const tcId of testCaseIDs) {
    // Build the relative path for readJSONFile/writeDataToFile
    const stubRelPath = path.join(relDir, `${tcId}.json`);

    // 1) Read existing stub
    let fullStub;
    try {
      fullStub = await readJSONFile(stubRelPath);
    } catch (err) {
      console.warn(`⚠️ Could not read stub for ${tcId}: ${err.message}`);
      continue;
    }

    const entry = fullStub[tcId];
    if (!entry || !entry.payloadCreateEmployee) {
      console.warn(`⚠️ No payloadCreateEmployee in ${tcId}.json — skipping`);
      continue;
    }

    // 2) Prepare createdEmployees array (preserve existing if any)
    entry.createdEmployees = entry.createdEmployees || [];

    // 3) Create employees for each status
    const base = entry.payloadCreateEmployee;
    for (const status of statuses) {
      const randomStr = getRandomString(5);
      const payload = {
        ...base,
        last_name: status + randomStr,
        status,
        date_of_joining: getYesterdayDate(),
        custom_reporting_manager: managerName,
        reports_to: managerId,
        leave_approver: managerMail,
        ...(status === "Left" && { relieving_date: getFormattedDate(new Date()) }),
      };

      try {
        const res = await addEmployee(payload, "admin");
        const empName = res.data.name;
        entry.createdEmployees.push({ ...payload, name: empName });
        //console.log(`✅ Created [${status}] ${empName} for ${tcId}`);
      } catch (err) {
        console.error(`❌ Error creating ${status} for ${tcId}: ${err.message}`);
      }
    }

    // 4) Merge back and write once
    fullStub[tcId] = entry;
    //console.log(`FULL STUB OF TC 91 IS :`, fullStub[tcId]);
    //console.log("\n---------------GAP-------------\n");
    //console.log(`FULL STUB OF TC 91 IS :`, fullStub);
  }
  // Build the absolute path so writeDataToFile can actually find it
  const absPath = path.resolve(__dirname, "../data/json-files", `${testCaseIDs}.json`);

  try {
    await writeDataToFile(absPath, fullStub);
    //console.log(`✏️  Persisted ${entry.createdEmployees.length} employees in ${testCaseIDs}.json`);
  } catch (err) {
    console.warn(`⚠️ Failed to write ${absPath}: ${err.message}`);
  }
}
*/
/*
export async function createEmployees(testCaseIDs = []) {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  // Directory where per-TC JSON stubs live
  const jsonDir = path.resolve(__dirname, "../data/json-files");
  // Ensure output directory exists
  //await fs.promises.mkdir(jsonDir, { recursive: true });

  const statuses = ["Active", "Inactive", "Suspended", "Left"];

  for (const tcId of testCaseIDs) {
    const stubPath = path.join(jsonDir, `${tcId}.json`);
    // Read the wrapped stub { "TCn": entry }
    const fullStub = await readJSONFile(stubPath);
    const entry = fullStub[tcId];
    if (!entry || !entry.payloadCreateEmployee) continue;

    // Initialize createdEmployees array
    entry.createdEmployees = [];
    const basePayload = entry.payloadCreateEmployee;

    for (const status of statuses) {
      const randomStr = getRandomString(5);
      const payload = {
        ...basePayload,
        last_name: status + randomStr,
        status,
        date_of_joining: getYesterdayDate(),
        custom_reporting_manager: managerName,
        reports_to: managerId,
        leave_approver: managerMail,
      };
      if (status === "Left") {
        payload.relieving_date = getFormattedDate(new Date());
      }

      try {
        const res = await addEmployee(payload, "admin");
        const empName = res.data.name;
        entry.createdEmployees.push({ ...payload, name: empName });
        //console.log(`✅ Created [${status}] ${empName} for ${tcId}`);
      } catch (err) {
        console.error(`❌ Error creating ${status} for ${tcId}: ${err.message}`);
      }
    }
    console.dir({ beforeWrite: { [tcId]: entry } }, { depth: null });
    // Persist the mutated stub, wrapped under its TC key
    await writeDataToFile(stubPath, { [tcId]: entry });

    ////console.log("CREATED EMPLOYEES ARRAY IS : ", entry.createEmployees)
    //console.log(`✏️  Updated createdEmployees for ${tcId} in ${stubPath}`);
  }
}
*/
/*
export async function createEmployees(testCaseIDs) {
  // Load the team JS into memory
  const managerTeamData = JSON.parse(JSON.stringify(teamTemplate));
  const employeeStatuses = ["Active", "Inactive", "Suspended", "Left"];

  for (const testCaseID of testCaseIDs) {
    const testCase = managerTeamData[testCaseID];
    if (!testCase || !testCase.payloadCreateEmployee) continue;

    testCase.createdEmployees = [];
    const basePayload = testCase.payloadCreateEmployee;

    for (const status of employeeStatuses) {
      const randomString = getRandomString(5);
      const payload = {
        ...basePayload,
        last_name: status + randomString,
        status,
        date_of_joining: getYesterdayDate(),
        custom_reporting_manager: managerName,
        reports_to: managerId,
        leave_approver: managerMail,
      };
      if (status === "Left") {
        payload.relieving_date = getFormattedDate(new Date());
      }

      try {
        const response = await addEmployee(payload, "admin");
        testCase.createdEmployees.push({ ...payload, name: response.data.name });
        //console.log(`✅ Created [${status}] ${response.data.name} for ${testCaseID}`);
      } catch (err) {
        console.error(`❌ Error creating ${status} for ${testCaseID}:`, err);
      }
    }

    // Write this test case's data to its JSON file
    const outDir = path.resolve(__dirname, "../data/json-files");
    // ensure directory exists
    await fs.promises.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${testCaseID}.json`);
    await writeDataToFile(outFile, testCase);
    //console.log(`• Wrote employee data for ${testCaseID} to ${outFile}`);
  }
}
*/
/*
export async function createEmployees(testCaseIDs) {
  // Load the team JS into memory
  const managerTeamData = JSON.parse(JSON.stringify(teamTemplate));

  const employeeStatuses = ["Active", "Inactive", "Suspended", "Left"];

  for (const testCaseID of testCaseIDs) {
    const testCase = managerTeamData[testCaseID];
    if (!testCase || !testCase.payloadCreateEmployee) continue;

    testCase.createdEmployees = [];
    const basePayload = testCase.payloadCreateEmployee;

    for (const status of employeeStatuses) {
      const randomString = getRandomString(5);
      const payload = {
        ...basePayload,
        last_name: status + randomString,
        status,
        date_of_joining: getYesterdayDate(),
        custom_reporting_manager: managerName,
        reports_to: managerId,
        leave_approver: managerMail,
      };
      if (status === "Left") {
        payload.relieving_date = getFormattedDate(new Date());
      }

      try {
        const response = await addEmployee(payload, "admin");

        // handle cross-test contamination
        if (status === "Active") {
          const fullName = `${payload.first_name} ${payload.last_name}`;
          if (managerTeamData["TC39"] &&
              !managerTeamData["TC39"].employees.includes(fullName)) {
                managerTeamData["TC39"].employees.push(fullName);
          }
          if (managerTeamData["TC53"]) {
            const tc53 = managerTeamData["TC53"];
            if (!tc53.employeesInQE.includes(fullName)) tc53.employeesInQE.push(fullName);
            if (!tc53.employeesInStaging.includes(fullName)) tc53.employeesInStaging.push(fullName);
          }
        }

        testCase.createdEmployees.push({ ...payload, name: response.data.name });
        //console.log(`✅ Created [${status}] ${response.data.name} for ${testCaseID}`);
      } catch (err) {
        console.error(`❌ Error creating ${status} for ${testCaseID}:`, err);
      }
    }
  }

  // Write back the updated shared data
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
}
*/

/**
 * Delete Employees created for each test case ID
 * @param {string[]} testCaseIDs
 */
export async function deleteEmployees(testCaseID,jsonDir) {
  // Path to this test's JSON file
  const filePath = path.join(jsonDir, `${testCaseID}.json`);

  //const filePath = path.resolve(__dirname, "../data/json-files", `${testCaseID}.json`);
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

  // Optionally clear out the createdEmployees array in its file
  //testCase.createdEmployees = [];
  /*
  try {
    await writeDataToFile(filePath, testCase);
    //console.log(`• Cleared createdEmployees in ${filePath}`);
  } catch (err) {
    console.warn(`⚠️ Failed to update ${filePath}: ${err.message}`);
  }
    */
}
/*
export async function deleteEmployees(testCaseIDs) {
  // Read from Json file
  let managerTeamData = await readJSONFile(managerTeamDataFilePath);

  for (const testCaseID of testCaseIDs) {
    const testCase = managerTeamData[testCaseID];
    if (!testCase || !Array.isArray(testCase.createdEmployees)) continue;

    for (const emp of testCase.createdEmployees) {
      if (!emp.name) continue;
      try {
        await deleteEmployee(emp.name, "admin");
        //console.log(`🗑 Deleted ${emp.name} for ${testCaseID}`);
      } catch (err) {
        console.warn(`⚠️ Failed to delete ${emp.name}: ${err.message}`);
      }
    }
    // clear out after deletion
    //testCase.createdEmployees = [];
  }

  // Persist the cleaned-up data
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
}
  */
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
