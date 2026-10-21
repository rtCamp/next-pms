import path from "path";
import { addEmployee } from "../utils/api/employeeRequests";
import { getDocList } from "../utils/api/apiClient";
import { likeTask } from "../utils/api/taskRequests";
import {
  actOnTimesheet,
  createTimesheet,
  submitTimesheet,
} from "../utils/api/timesheetRequests";
import { dateInWeek, getYesterdayDate } from "../utils/dateUtils";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { getRandomString } from "../utils/stringUtils";
import { seedTask } from "./taskHelper";

const WORKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// The shared accounts a test can log in as, with the role whose session acts for each.
const SHARED_EMPLOYEES = {
  EMP: { id: process.env.EMP_ID, role: "employee" },
  EMP2: { id: process.env.EMP2_ID, role: "employee2" },
  EMP3: { id: process.env.EMP3_ID, role: "employee3" },
};

// A seeded employee's name starts "Playwright-", which is what the suite's employee sweep deletes by.
const SEEDED_EMPLOYEE = {
  first_name: "Playwright-",
  gender: "Male",
  date_of_birth: "2000-02-01",
  // Saving a timesheet runs the costing hook, which needs a salary currency.
  ctc: 100000,
  salary_currency: "USD",
};

/** The id behind a name a test case's data uses for an employee: EMP, EMP2, EMP3 or one it seeded. */
const employeeId = (entry, name) => {
  const id = SHARED_EMPLOYEES[name]?.id ?? entry.employees?.[name]?.id;
  if (!id) throw new Error(`No employee called "${name}" to seed time for`);
  return id;
};

/**
 * Creates the throwaway employees a case lists in `payloadCreateWeekEmployees`
 * ({ <name>: {} }), who report to the manager, and records their ids on the stub.
 */
const createEmployees = async (entry) => {
  entry.employees = {};
  for (const name of Object.keys(entry.payloadCreateWeekEmployees ?? {})) {
    const lastName = `${name}${getRandomString(5)}`;
    const res = await addEmployee(
      {
        ...SEEDED_EMPLOYEE,
        last_name: lastName,
        status: "Active",
        date_of_joining: getYesterdayDate(),
        custom_reporting_manager: process.env.REP_MAN_NAME,
        reports_to: process.env.REP_MAN_ID,
        leave_approver: process.env.REP_MAN_EMAIL,
      },
      "admin",
    );
    entry.employees[name] = {
      id: res.data.name,
      name: `${SEEDED_EMPLOYEE.first_name} ${lastName}`,
    };
  }
};

/**
 * Logs time for a case's employees in past weeks, and moves weeks on through
 * submission and approval, from these keys of its data:
 *   payloadCreateWeekEmployees  { <name>: {} } - employees to create besides EMP, EMP2 and EMP3
 *   payloadCreateWeekTime       [{ employee, project, subject, weeksAgo, days, hours, comment, role }]
 *                               `project` is the postfix of the payloadCreateProject it books against
 *   payloadWeekStatus           [{ employee, weeksAgo, status: "pending" | "approved" | "rejected" }]
 *   payloadLikeTasks            [{ employee, project, subject }] - the employee stars the task
 */
export const createWeekTimeForTestCases = async (testCaseIDs, jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;
  const [tcId] = testCaseIDs;
  const stubPath = path.join(jsonDir, `${tcId}.json`);
  const entry = (await readJSONFile(stubPath))[tcId];
  if (!entry?.payloadCreateWeekTime && !entry?.payloadCreateWeekEmployees) {
    return;
  }

  await createEmployees(entry);

  const projectId = (postfix = "") =>
    entry[`payloadDeleteProject${postfix}`]?.projectId;
  const tasks = {};
  const taskOf = async (postfix, subject) => {
    const key = `${postfix}|${subject}`;
    tasks[key] ??= (await seedTask(projectId(postfix), subject)).name;
    return tasks[key];
  };

  const booked = {};
  for (const spec of entry.payloadCreateWeekTime ?? []) {
    const employee = employeeId(entry, spec.employee);
    const task = await taskOf(spec.project, spec.subject);
    for (const day of spec.days ?? WORKDAYS) {
      const date = dateInWeek(spec.weeksAgo, day);
      await createTimesheet(
        {
          task,
          description: `<p>${spec.comment ?? spec.subject}</p>`,
          hours: String(spec.hours),
          date,
          employee,
        },
        // A week past the backdate limit can only be booked by an admin.
        spec.role ?? "manager",
      );
      (booked[`${spec.employee}|${spec.weeksAgo}`] ??= []).push(date);
    }
  }

  for (const { employee, weeksAgo, status } of entry.payloadWeekStatus ?? []) {
    const id = employeeId(entry, employee);
    const dates = booked[`${employee}|${weeksAgo}`] ?? [];
    await submitTimesheet(
      {
        start_date: dateInWeek(weeksAgo, "Mon"),
        end_date: dateInWeek(weeksAgo, "Sun"),
        notes: `${tcId} - submitted by global setup`,
        approver: process.env.REP_MAN_ID,
        employee: id,
      },
      "admin",
    );
    if (status === "pending") continue;

    const decision = status === "approved" ? "Approved" : "Rejected";
    await actOnTimesheet(
      {
        dates,
        employee: id,
        note: `${tcId} - ${status} by global setup`,
        status: decision,
      },
      "admin",
    );
    await waitForStatus(id, dates, decision);
  }

  for (const { employee, project, subject } of entry.payloadLikeTasks ?? []) {
    await likeTask(
      await taskOf(project, subject),
      SHARED_EMPLOYEES[employee].role,
    );
  }

  await writeDataToFile(stubPath, { [tcId]: entry });
  console.log(`✅ CREATE WEEK TIME SUCCESS FOR: ${testCaseIDs}`);
};

// Approval is queued, so the status lands a moment after the call returns.
const waitForStatus = async (employee, dates, status) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const rows = await getDocList(
      "Timesheet",
      [
        ["employee", "=", employee],
        ["start_date", "in", dates],
      ],
      { fields: ["custom_approval_status"] },
    );
    if (rows.length && rows.every((r) => r.custom_approval_status === status)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  console.warn(`⚠️ ${employee}'s time never reached "${status}"`);
};
