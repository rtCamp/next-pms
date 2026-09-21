import { readdir } from "fs/promises";
import path from "path";
import { getFormattedDate, getYesterdayDate, getDateForWeekday } from "../utils/dateUtils";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { addEmployee, deleteEmployee, updateEmployee } from "../utils/api/employeeRequests";
import { deleteAllocation } from "../utils/api/projectRequests";
import { getRandomString } from "../utils/stringUtils";
import { filterApi } from "../utils/api/frappeRequests";
import { getDocList, cancelDocument, deleteDocument, deleteWithLockRetry } from "../utils/api/apiClient";
import { createTimesheet } from "../utils/api/timesheetRequests";

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

  console.dir(verify, { depth: null, colors: true });
  // Write back any side files that were loaded
  for (const fileName of sideFiles) {
    const fullPath = path.join(jsonDir, fileName);
    await writeDataToFile(fullPath, sideData[fileName]);
  }
  // Report what actually happened - this used to print ✅ even when every
  // creation had failed, which is how TC91 came to look healthy while its
  // assertions had nothing to run against.
  if (entry.createdEmployees.length === employeeStatuses.length) {
    console.log(`✅ Created ${entry.createdEmployees.length} employee(s) for ${tcId}`);
  } else {
    console.error(
      `❌ Created only ${entry.createdEmployees.length} of ${employeeStatuses.length} employee(s) for ${tcId} - ` +
        `any test relying on them cannot verify anything.`
    );
  }
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
    const { deleted, reason } = await deleteEmployee(emp.name, "admin");
    if (!deleted) {
      console.warn(`⚠️ Failed to delete ${emp.name} for ${testCaseID}: ${reason}`);
    }
  }
}
// ------------------------------------------------------------------------------------------

/**
 * Filter the employees by their first name: "Playwright-" and delete them
 */
/**
 * Creates ONE dedicated employee for a test case, for tests that need to change
 * an employee's timesheet state without disturbing anyone else's.
 *
 * Why this exists: the review pane only opens for a *submitted* timesheet, so
 * TC47 and TC49 need one. Submitting a shared account's current week breaks the
 * tests that need it unsubmitted - TC11 asserts the employee still sees "Submit
 * for approval", and TC6 is literally "delete a time entry from the
 * non-submitted timesheet". Every shared account is spoken for that way, so
 * these tests get their own employee instead.
 *
 * Distinct from createEmployees(), which always creates four (one per status)
 * for TC91's status-filter coverage.
 *
 * The name carries the "Playwright-" prefix so deleteEmployeeByName() sweeps it
 * up at teardown. The created id is pinned onto the test's timesheet and submit
 * payloads, so nothing downstream has to know which employee it got.
 */
export const createRevieweeForTestCases = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const [tcId] = testCaseIDs;
  const stubPath = path.join(jsonDir, `${tcId}.json`);

  let fullStub;
  try {
    fullStub = await readJSONFile(stubPath);
  } catch (err) {
    console.warn(`⚠️ Failed to read stub for ${tcId}: ${err.message}`);
    return;
  }

  const entry = fullStub[tcId];
  if (!entry || !entry.payloadCreateReviewee) return;

  const payload = {
    ...JSON.parse(JSON.stringify(entry.payloadCreateReviewee)),
    last_name: `Reviewee${getRandomString(5)}`,
    status: "Active",
    date_of_joining: getYesterdayDate(),
    custom_reporting_manager: managerName,
    reports_to: managerId,
    leave_approver: managerMail,
  };

  try {
    const res = await addEmployee(payload, "admin");
    const employeeId = res.data.name;
    const employeeName = `${payload.first_name} ${payload.last_name}`;

    entry.revieweeId = employeeId;
    entry.revieweeName = employeeName;

    // Pin the new employee onto whatever this test seeds for them, so the
    // shared helpers do not fall back to the per-TC default account.
    Object.keys(entry)
      .filter((k) => k.startsWith("payloadCreateTimesheet"))
      .forEach((k) => {
        entry[k].employee = employeeId;
      });
    if (entry.payloadSubmitTimesheet) {
      entry.payloadSubmitTimesheet.employee = employeeId;
    }

    await writeDataToFile(stubPath, { [tcId]: entry });
    console.log(`✅ Created reviewee for ${tcId}: ${employeeName} (${employeeId})`);
  } catch (err) {
    console.error(`❌ Could not create reviewee for ${tcId}: ${err.message}`);
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Books one hour for every employee createEmployees() seeded, so they show up
 * on the team grid.
 *
 * Needed because the filtered team view lists only members with time logged in
 * the visible week - an employee with no entries is invisible no matter what
 * their status or reporting manager is. Verified directly: the same employee is
 * absent with 0 entries and present with 1.
 *
 * Runs after createTaskForTestCases, which is what supplies the task id.
 */
/**
 * Registers every reviewee this run created in TC53's expected roster.
 *
 * Reviewees report to the manager, so TC53 sees them for the length of the run.
 * Must run after the seeding loop, not inside createRevieweeForTestCases:
 * TC53's own turn rewrites its stub, wiping anything registered before it.
 */
export const registerRevieweesInTeamRoster = async (testCaseIDs = [], jsonDir) => {
  const rosterPath = path.join(jsonDir, "TC53.json");

  let roster;
  try {
    roster = await readJSONFile(rosterPath);
  } catch {
    return; // TC53 is not in this run
  }
  const block = roster?.TC53;
  if (!block) return;

  const names = [];
  for (const tcId of testCaseIDs) {
    try {
      const entry = (await readJSONFile(path.join(jsonDir, `${tcId}.json`)))?.[tcId];
      if (entry?.revieweeName) names.push(entry.revieweeName);
    } catch {
      // no stub for this TC - nothing to register
    }
  }
  if (names.length === 0) return;

  for (const listName of ["employeesInQE", "employeesInStaging"]) {
    const list = (block[listName] ||= []);
    for (const n of names) if (!list.includes(n)) list.push(n);
  }

  await writeDataToFile(rosterPath, roster);
  console.log(`👥 Registered ${names.length} reviewee(s) in TC53's expected roster: ${names.join(", ")}`);
};

// ------------------------------------------------------------------------------------------

export const createTimeEntriesForSeededEmployees = async (testCaseIDs = [], jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const [tcId] = testCaseIDs;
  const stubPath = path.join(jsonDir, `${tcId}.json`);

  let fullStub;
  try {
    fullStub = await readJSONFile(stubPath);
  } catch (err) {
    console.warn(`⚠️ Failed to read stub for ${tcId}: ${err.message}`);
    return;
  }

  const entry = fullStub[tcId];
  const employees = entry?.createdEmployees;
  if (!Array.isArray(employees) || employees.length === 0) return;

  const taskID = entry?.payloadDeleteTask?.taskID;
  if (!taskID || String(taskID).startsWith("filled-automatically")) {
    console.warn(`⚠️ ${tcId}: no task to book against, seeded employees will not appear on the team grid.`);
    return;
  }

  const date = entry?.cell?.col ? getFormattedDate(getDateForWeekday(entry.cell.col)) : getFormattedDate(new Date());

  for (const employee of employees) {
    if (!employee?.name) continue;

    // ERPNext refuses transactions for an Inactive employee
    // ("InactiveEmployeeStatusError"), so book the hour while they are Active
    // and set the real status afterwards - which is also how it happens in
    // life: people log time, then later become inactive. Suspended and Left
    // are accepted directly, but the same round trip keeps this uniform.
    const targetStatus = employee.status;
    const needsToggle = targetStatus && targetStatus !== "Active";

    try {
      if (needsToggle) {
        await updateEmployee(employee.name, { status: "Active" }, "admin");
      }

      await createTimesheet({
        task: taskID,
        description: `<p>${tcId} - Task added via automation.</p>`,
        hours: "1",
        date,
        employee: employee.name,
      });
      console.log(`✅ Booked 1h for ${tcId} employee ${employee.name} (${targetStatus}) on ${date}`);
    } catch (err) {
      console.error(`❌ Could not book time for ${tcId} employee ${employee.name}: ${err.message}`);
    } finally {
      // Restore the status even if the booking failed, or the test would be
      // filtering on a status the employee no longer has.
      if (needsToggle) {
        try {
          await updateEmployee(employee.name, { status: targetStatus }, "admin");
        } catch (err) {
          console.error(`❌ Could not restore status "${targetStatus}" on ${employee.name}: ${err.message}`);
        }
      }
    }
  }
};
// ------------------------------------------------------------------------------------------

export const deleteEmployeeByName = async () => {
  const employees = await getDocList("Employee", [["employee_name", "like", "Playwright-%"]], {
    fields: ["name", "employee_name"],
  });

  if (employees.length === 0) {
    console.log("🧹 No seeded employees left to clean up.");
    return;
  }

  const survivors = [];
  for (const emp of employees) {
    // Frappe refuses to delete an employee that any document still points at,
    // and every seeded employee has a timesheet booked against it, so the
    // timesheets have to go first. Submitted ones need cancelling before they
    // can be deleted.
    const timesheets = await getDocList("Timesheet", [["employee", "=", emp.name]], {
      fields: ["name", "docstatus"],
    });
    for (const ts of timesheets) {
      if (ts.docstatus === 1) await cancelDocument("Timesheet", ts.name);
      await deleteWithLockRetry(() => deleteDocument("Timesheet", ts.name), {
        label: `Timesheet ${ts.name}`,
      });
    }

    const { deleted, reason } = await deleteWithLockRetry(() => deleteDocument("Employee", emp.name), {
      label: `Employee ${emp.name}`,
    });
    if (deleted) {
      console.log(`🗑  Deleted ${emp.name} (${emp.employee_name})`);
    } else {
      survivors.push(`${emp.name} (${emp.employee_name}): ${reason}`);
    }
  }

  // Say what survived. These accumulate silently otherwise, and once enough of
  // them report to the manager, TC53's expected roster no longer matches.
  if (survivors.length) {
    console.warn(`⚠️ ${survivors.length} seeded employee(s) could not be deleted:`);
    survivors.forEach((s) => console.warn(`   - ${s}`));
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
  if (filterResponse.message?.values?.length > 0) {
    const allocations = filterResponse.message.values;
    for (const row of allocations) {
      const allocationName = row[0];
      try {
        await deleteAllocation(allocationName);
      } catch (error) {
        console.error(`Failed to delete ${allocationName}:`, error);
      }
    }
  }
};
