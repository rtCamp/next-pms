import path from "path";
import { addEmployee } from "../utils/api/employeeRequests";
import {
  cancelDocument,
  createDocument,
  deleteDocument,
  getDocList,
  getDocument,
  updateDocument,
} from "../utils/api/apiClient";
import { likeTask } from "../utils/api/taskRequests";
import {
  actOnTimesheet,
  apiRequest,
  createTimesheet,
  submitTimesheet,
} from "../utils/api/timesheetRequests";
import {
  dateInWeek,
  getFormattedDate,
  getYesterdayDate,
  mondayWeeksAgo,
} from "../utils/dateUtils";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { getRandomString } from "../utils/stringUtils";
import { seedTask } from "./taskHelper";

const WORKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY = 24 * 60 * 60 * 1000;

// The shared accounts a test can log in as, with the role whose session acts for each.
const SHARED_EMPLOYEES = {
  EMP: { id: process.env.EMP_ID, role: "employee" },
  EMP2: { id: process.env.EMP2_ID, role: "employee2" },
  EMP3: { id: process.env.EMP3_ID, role: "employee3" },
  MANAGER: { id: process.env.REP_MAN_ID, role: "manager" },
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

/** The id behind a name a test case's data uses for an employee: EMP, EMP2, EMP3, MANAGER or one it seeded. */
const employeeId = (entry, name) => {
  const id = SHARED_EMPLOYEES[name]?.id ?? entry.employees?.[name]?.id;
  if (!id) throw new Error(`No employee called "${name}" to seed time for`);
  return id;
};

const WEEKENDS_OFF = "E2E Weekends Off";

/** A holiday list with no holidays, or with every Saturday and Sunday off when `weekendsOff`. */
const ensureHolidayList = async (name, weekendsOff = false) => {
  const [existing] = await getDocList("Holiday List", [["name", "=", name]]);
  if (existing) return name;
  const year = new Date().getFullYear();
  const holidays = [];
  for (
    const day = new Date(year - 1, 0, 1);
    weekendsOff && day.getFullYear() <= year + 1;
    day.setDate(day.getDate() + 1)
  ) {
    if (day.getDay() % 6 === 0) {
      holidays.push({
        holiday_date: getFormattedDate(day),
        description: day.getDay() ? "Saturday" : "Sunday",
        weekly_off: 1,
      });
    }
  }
  await createDocument("Holiday List", {
    holiday_list_name: name,
    from_date: `${year - 1}-01-01`,
    to_date: `${year + 1}-12-31`,
    holidays,
  });
  return name;
};

let assignmentsExist;

/**
 * Gives an employee a holiday list. Newer HRMS reads it from a Holiday List Assignment,
 * not the Employee field; the field goes last, as changing it clears the app's holiday cache.
 */
const assignHolidayList = async (id, holidayList) => {
  assignmentsExist ??=
    (await getDocList("DocType", [["name", "=", "Holiday List Assignment"]]))
      .length > 0;
  if (assignmentsExist) {
    const { from_date } = await getDocument("Holiday List", holidayList);
    await createDocument("Holiday List Assignment", {
      applicable_for: "Employee",
      assigned_to: id,
      holiday_list: holidayList,
      from_date,
      docstatus: 1,
    });
  }
  await updateDocument("Employee", id, { holiday_list: holidayList });
};

/** The days off the app counts for an employee last week, as the manager's Team tab reads them; null when not listed. */
const holidaysLastWeek = async (id) => {
  const { employee_name } = await getDocument("Employee", id);
  const res = await apiRequest(
    `/api/method/next_pms.timesheet.api.team.get_team_timesheet_data?${new URLSearchParams(
      { start_date: dateInWeek(1, "Mon"), search: employee_name },
    )}`,
    { method: "GET" },
    "manager",
  );
  return (
    res?.message?.members?.find((member) => member.employee === id)?.holidays ??
    null
  );
};

/**
 * Gives each shared employee in `payloadWeekendsOff` Saturdays and Sundays off when the
 * app counts none for them last week; without them a week has seven working days, so a
 * whole Monday-to-Friday week approved reads Partially approved.
 */
const giveWeekendsOff = async (entry) => {
  for (const name of entry.payloadWeekendsOff ?? []) {
    const id = employeeId(entry, name);
    const holidays = await holidaysLastWeek(id);
    if (!holidays) {
      console.warn(
        `⚠️ ${name} is not on the manager's Team tab; weekends left as they are`,
      );
    } else if (holidays.length === 0) {
      await assignHolidayList(id, await ensureHolidayList(WEEKENDS_OFF, true));
    }
  }
};

/** The name of the `doctype` record whose `field` is `value`, created when missing. */
const ensureMaster = async (doctype, field, value, extra = {}) => {
  const [existing] = await getDocList(doctype, [
    [field, "=", value],
    ...Object.entries(extra).map(([key, val]) => [key, "=", val]),
  ]);
  if (existing) return existing.name;
  return (await createDocument(doctype, { [field]: value, ...extra })).name;
};

/** Sets a seeded employee's designation, department and skills, creating the masters. */
const setProfile = async (employee, { designation, department, skills }) => {
  const profile = {};
  if (designation) {
    profile.designation = await ensureMaster(
      "Designation",
      "designation_name",
      designation,
    );
  }
  if (department) {
    profile.department = await ensureMaster(
      "Department",
      "department_name",
      department,
      { company: employee.company },
    );
  }
  if (Object.keys(profile).length) {
    await updateDocument("Employee", employee.name, profile);
  }
  if (skills?.length) {
    const employeeSkills = [];
    for (const skill of skills) {
      await ensureMaster("Skill", "skill_name", skill);
      employeeSkills.push({ skill, proficiency: 0.6 });
    }
    await createDocument("Employee Skill Map", {
      employee: employee.name,
      employee_skills: employeeSkills,
    });
  }
};

/**
 * Creates the throwaway employees a case lists in `payloadCreateWeekEmployees`
 * ({ <name>: { managed, holidayList, weekendsOff, designation, department, skills } })
 * and records their ids on the stub.
 * They report to the manager unless `managed` is false (the manager stays their leave
 * approver either way); `holidayList` replaces the company's (created empty when missing),
 * and `weekendsOff` replaces it with one that has every Saturday and Sunday off.
 */
const createEmployees = async (entry) => {
  entry.employees = {};
  for (const [name, options] of Object.entries(
    entry.payloadCreateWeekEmployees ?? {},
  )) {
    const lastName = `${name}${getRandomString(5)}`;
    const res = await addEmployee(
      {
        ...SEEDED_EMPLOYEE,
        last_name: lastName,
        status: "Active",
        date_of_joining: getYesterdayDate(),
        // Some sites make a leave approver mandatory, so every seeded employee has one.
        leave_approver: process.env.REP_MAN_EMAIL,
        ...(options?.managed === false
          ? {}
          : {
              custom_reporting_manager: process.env.REP_MAN_NAME,
              reports_to: process.env.REP_MAN_ID,
            }),
      },
      "admin",
    );
    await setProfile(res.data, options ?? {});
    if (options?.weekendsOff) {
      await assignHolidayList(
        res.data.name,
        await ensureHolidayList(WEEKENDS_OFF, true),
      );
    } else if (options?.holidayList) {
      await assignHolidayList(
        res.data.name,
        await ensureHolidayList(options.holidayList),
      );
    }
    entry.employees[name] = {
      id: res.data.name,
      name: `${SEEDED_EMPLOYEE.first_name} ${lastName}`,
    };
  }
};

/**
 * How many weeks back the week before the manager's backdate limit for an employee
 * starts, read from the Team tab's own data as the manager sees it.
 */
const weeksPastBackdateLimit = async (employee) => {
  const res = await apiRequest(
    `/api/method/next_pms.timesheet.api.team.get_team_timesheet_data?${new URLSearchParams(
      { start_date: getFormattedDate(new Date()), search: employee.name },
    )}`,
    { method: "GET" },
    "manager",
  );
  const boundary = res?.message?.members?.find(
    (member) => member.employee === employee.id,
  )?.backdate_restricted_before;
  if (!boundary) return null;
  const monday = mondayWeeksAgo(0);
  monday.setHours(0, 0, 0, 0);
  const limit = new Date(`${boundary}T00:00:00`);
  limit.setDate(limit.getDate() - ((limit.getDay() + 6) % 7));
  // The week before the one the limit falls in, so every day of it is past the limit.
  return Math.round((monday - limit) / (7 * DAY)) + 1;
};

/** Replaces each `weeksAgo: "pastBackdateLimit"` with a number, and records it on the stub. */
const resolveWeeks = async (entry) => {
  entry.resolvedWeeks = {};
  for (const spec of [
    ...(entry.payloadCreateWeekTime ?? []),
    ...(entry.payloadWeekStatus ?? []),
  ]) {
    if (spec.weeksAgo !== "pastBackdateLimit") continue;
    entry.resolvedWeeks[spec.employee] ??= await weeksPastBackdateLimit(
      entry.employees[spec.employee],
    );
    spec.weeksAgo = entry.resolvedWeeks[spec.employee];
  }
};

const projectIdOf = (entry, postfix = "") =>
  entry[`payloadDeleteProject${postfix}`]?.projectId;

/** The task with this subject on a case's project, created the first time it is asked for. */
const taskFinder = (entry) => {
  const tasks = {};
  return async (postfix, subject) => {
    const key = `${postfix}|${subject}`;
    if (!tasks[key]) {
      const project = projectIdOf(entry, postfix);
      const [existing] = await getDocList("Task", [
        ["project", "=", project],
        ["subject", "=", subject],
      ]);
      tasks[key] = existing?.name ?? (await seedTask(project, subject)).name;
    }
    return tasks[key];
  };
};

/** Logs the time of the specs given, and returns the dates booked per employee and week. */
const bookTime = async (entry, specs, taskOf) => {
  const booked = {};
  for (const spec of specs) {
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
  return booked;
};

/** Books the half-day or full-day leaves of `payloadWeekLeave` as admin, who may backdate them. */
const bookLeave = async (entry, specs) => {
  for (const spec of specs) {
    const date = dateInWeek(spec.weeksAgo, spec.day);
    await createDocument("Leave Application", {
      employee: employeeId(entry, spec.employee),
      leave_type: spec.leaveType ?? "Unpaid Time Off",
      from_date: date,
      to_date: date,
      leave_approver: process.env.REP_MAN_EMAIL,
      ...(spec.half
        ? {
            half_day: 1,
            half_day_date: date,
            custom_first_halfsecond_half: spec.half,
          }
        : {}),
      description: spec.reason,
    });
  }
};

/** Sends weeks for approval as admin and decides them, all days or only `days`. */
const decideWeeks = async (entry, tcId, specs, booked) => {
  for (const { employee, weeksAgo, status, days, note } of specs) {
    const id = employeeId(entry, employee);
    const dates = (booked[`${employee}|${weeksAgo}`] ?? []).filter(
      (date) => !days || days.some((day) => dateInWeek(weeksAgo, day) === date),
    );
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
        note: note ?? `${tcId} - ${status} by global setup`,
        status: decision,
      },
      "admin",
    );
    await waitForStatus(id, dates, decision);
  }
};

const ALLOCATE =
  "/api/method/next_pms.resource_management.api.allocation.handle_allocation";

/**
 * Books the allocations of `payloadWeekAllocations` through the app's own endpoint, as
 * admin: [{ employee, project, weeksAgo, from, to, hours, billable, tentative, note,
 * repeatWeeks }]. `weeksAgo` below 0 is a week ahead; `from`/`to` default to Mon/Fri.
 */
const bookAllocations = async (entry, specs) => {
  for (const spec of specs) {
    const from = dateInWeek(spec.weeksAgo, spec.from ?? "Mon");
    const to = dateInWeek(spec.weeksAgo, spec.to ?? "Fri");
    const days = Math.round((new Date(to) - new Date(from)) / DAY) + 1;
    const project = entry[`payloadCreateProject${spec.project}`];
    await apiRequest(
      ALLOCATE,
      {
        method: "POST",
        data: {
          allocation: {
            doctype: "Resource Allocation",
            employee: employeeId(entry, spec.employee),
            project: projectIdOf(entry, spec.project),
            customer: project.customer,
            allocation_start_date: from,
            allocation_end_date: to,
            hours_allocated_per_day: spec.hours,
            total_allocated_hours: spec.hours * days,
            include_weekends: false,
            is_billable: spec.billable === false ? 0 : 1,
            status: spec.tentative ? "Tentative" : "Confirmed",
            note: spec.note ?? "",
          },
          repeat_till_week_count: spec.repeatWeeks ?? 0,
        },
      },
      "admin",
    );
  }
};

/** Tags a case's projects: `payloadProjectTags` [{ project: <postfix>, tag }]. */
const tagProjects = async (entry, specs) => {
  for (const { project, tag } of specs) {
    await apiRequest(
      "/api/method/frappe.desk.doctype.tag.tag.add_tag",
      {
        method: "POST",
        data: { tag, dt: "Project", dn: projectIdOf(entry, project) },
      },
      "admin",
    );
  }
};

/** Deletes an employee's allocations on the case's projects and books them again; for retried writing cases. */
export const reseedAllocations = async (entry, employee) => {
  const id = employeeId(entry, employee);
  const projects = Object.keys(entry)
    .filter((key) => key.startsWith("payloadDeleteProject"))
    .map((key) => entry[key].projectId);
  for (const { name } of await getDocList("Resource Allocation", [
    ["employee", "=", id],
    ["project", "in", projects],
  ])) {
    await deleteDocument("Resource Allocation", name);
  }
  await bookAllocations(
    entry,
    (entry.payloadWeekAllocations ?? []).filter(
      (spec) => spec.employee === employee,
    ),
  );
};

/**
 * Logs time for a case's employees in past weeks, and moves weeks on through
 * submission and approval, from these keys of its data:
 *   payloadCreateWeekEmployees  { <name>: { managed, holidayList, weekendsOff } } - employees to create besides the shared ones
 *   payloadWeekendsOff          [<shared name>] - given Saturdays and Sundays off when their site has none
 *   payloadCreateWeekTime       [{ employee, project, subject, weeksAgo, days, hours, comment, role }]
 *                               `project` is the postfix of the payloadCreateProject it books against;
 *                               `weeksAgo` may be "pastBackdateLimit"
 *   payloadWeekLeave            [{ employee, weeksAgo, day, half, reason }] - booked as admin
 *   payloadWeekStatus           [{ employee, weeksAgo, status: "pending" | "approved" | "rejected", days, note }]
 *   payloadLikeTasks            [{ employee, project, subject }] - the employee stars the task
 *   payloadWeekAllocations      [{ employee, project, weeksAgo, from, to, hours, ... }] - see bookAllocations
 *   payloadProjectTags          [{ project, tag }] - tags the case's projects
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
  await giveWeekendsOff(entry);
  await resolveWeeks(entry);

  const taskOf = taskFinder(entry);
  const booked = await bookTime(
    entry,
    entry.payloadCreateWeekTime ?? [],
    taskOf,
  );
  await bookLeave(entry, entry.payloadWeekLeave ?? []);
  await bookAllocations(entry, entry.payloadWeekAllocations ?? []);
  await tagProjects(entry, entry.payloadProjectTags ?? []);
  await decideWeeks(entry, tcId, entry.payloadWeekStatus ?? [], booked);

  for (const { employee, project, subject } of entry.payloadLikeTasks ?? []) {
    await likeTask(
      await taskOf(project, subject),
      SHARED_EMPLOYEES[employee].role,
    );
  }

  await writeDataToFile(stubPath, { [tcId]: entry });
  console.log(`✅ CREATE WEEK TIME SUCCESS FOR: ${testCaseIDs}`);
};

/**
 * Puts one employee's week back the way the case's data seeds it: deletes what the
 * week holds now, books its time again and replays its status. A test calls this
 * when a retry finds the week already changed by the attempt before.
 */
export const reseedWeek = async (entry, tcId, employee, weeksAgo) => {
  const id = employeeId(entry, employee);
  const week = await getDocList(
    "Timesheet",
    [
      ["employee", "=", id],
      ["start_date", ">=", dateInWeek(weeksAgo, "Mon")],
      ["start_date", "<=", dateInWeek(weeksAgo, "Sun")],
    ],
    { fields: ["name", "docstatus"] },
  );
  for (const { name, docstatus } of week) {
    if (docstatus === 1) await cancelDocument("Timesheet", name);
    await deleteDocument("Timesheet", name);
  }
  const mine = (spec) =>
    spec.employee === employee && spec.weeksAgo === weeksAgo;
  const booked = await bookTime(
    entry,
    (entry.payloadCreateWeekTime ?? []).filter(mine),
    taskFinder(entry),
  );
  await decideWeeks(
    entry,
    tcId,
    (entry.payloadWeekStatus ?? []).filter(mine),
    booked,
  );
};

/** The approval status of each of an employee's timesheets in a week. */
export const weekStatuses = async (entry, employee, weeksAgo) =>
  (
    await getDocList(
      "Timesheet",
      [
        ["employee", "=", employeeId(entry, employee)],
        ["start_date", ">=", dateInWeek(weeksAgo, "Mon")],
        ["start_date", "<=", dateInWeek(weeksAgo, "Sun")],
      ],
      { fields: ["custom_approval_status"] },
    )
  ).map((row) => row.custom_approval_status);

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
