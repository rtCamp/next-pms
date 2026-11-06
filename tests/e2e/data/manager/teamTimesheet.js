const COMPANY = "rtCamp Solutions Pvt. Ltd.";
const ALPHA = "TM Alpha task";

const project = (label, postfix = "", sharedWith = []) => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `TM ${label}`,
    company: COMPANY,
    customer: "QA-INR",
    project_type: "Fixed Cost",
    business_unit: "Jupiter",
    custom_project_budget_hours: [],
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
  ...(sharedWith.length
    ? {
        [`payloadShareProject${postfix}`]: sharedWith.map((user) => ({
          doctype: "Project",
          name: "filled-automatically-from-createProjects",
          user,
          readValue: 1,
          writeValue: 1,
          submitValue: 0,
          shareValue: 0,
          notifyValue: 1,
        })),
      }
    : {}),
});

// A week of an hour a day on TM Alpha, Monday to Friday.
const alphaWeek = (employee, weeksAgo, extra = {}) => ({
  employee,
  project: "",
  subject: ALPHA,
  weeksAgo,
  hours: 1,
  role: "admin",
  ...extra,
});

// No reporting manager: these stay out of TC53's roster of the manager's reports.
const unmanaged = (names, options = {}) =>
  Object.fromEntries(
    names.map((name) => [name, { managed: false, ...options }]),
  );

const FILLERS = Array.from(
  { length: 9 },
  (_, index) => `TmFiller${String(index + 1).padStart(2, "0")}`,
);

// One fixture, read by every Team Timesheet case (TC229 to TC264): employees named
// "Playwright- Tm..." in each state a member row and the approval drawer can show.
module.exports = {
  TC232: {
    ...project("Alpha", "", [process.env.EMP_EMAIL]),
    ...project("Beta", "2"),
    ...project("Empty", "3"),
    payloadCreateWeekEmployees: {
      ...unmanaged(
        [
          "TmDraft",
          "TmPending",
          "TmApproved",
          "TmRejected",
          "TmApprove",
          "TmQueued",
          "TmLocked",
          "TmOneDay",
          "TmLeave",
          "TmOld",
          "TmHistory",
          "TmAddTime",
          ...FILLERS,
        ],
        { weekendsOff: true },
      ),
      // A manager may only book leave for someone who reports to them; no days off, so
      // today is always a working day for it.
      TmTimeOff: { holidayList: "E2E No Weekly Off" },
    },
    // Week statuses count working days, and some sites have no weekend off.
    payloadWeekendsOff: ["EMP"],
    payloadCreateWeekTime: [
      alphaWeek("TmDraft", 1, { days: ["Mon", "Tue", "Wed"], hours: 2 }),
      {
        employee: "TmDraft",
        project: "2",
        subject: "TM Beta task",
        weeksAgo: 1,
        days: ["Thu", "Fri"],
        hours: 1,
        role: "admin",
      },
      ...[
        "TmPending",
        "TmApproved",
        "TmRejected",
        "TmApprove",
        "TmQueued",
        "TmLocked",
        "TmOneDay",
      ].map((employee) => alphaWeek(employee, 1)),
      alphaWeek("TmLeave", 1, { days: ["Mon"], hours: 8 }),
      alphaWeek("TmLeave", 1, { days: ["Tue"], hours: 4 }),
      // Before the manager's backdate limit for this employee, worked out at seed time.
      alphaWeek("TmOld", "pastBackdateLimit", { days: ["Mon"] }),
      // Older than the twelve weeks the tab loads first, so there is more to scroll to.
      alphaWeek("TmHistory", 14, { days: ["Mon"] }),
      // The manager's own week, which the manager must not be able to decide.
      alphaWeek("MANAGER", 2, { days: ["Mon"] }),
      // EMP's weeks for the cases that need the employee's own session.
      alphaWeek("EMP", 1),
      alphaWeek("EMP", 4),
    ],
    payloadWeekLeave: [
      {
        employee: "TmLeave",
        weeksAgo: 1,
        day: "Tue",
        half: "First Half",
        reason: "TC232 - first half off",
      },
    ],
    payloadWeekStatus: [
      { employee: "TmPending", weeksAgo: 1, status: "pending" },
      { employee: "TmApproved", weeksAgo: 1, status: "approved" },
      {
        employee: "TmRejected",
        weeksAgo: 1,
        status: "rejected",
        days: ["Mon"],
        note: "TC262 - Monday needs a clearer comment",
      },
      ...["TmApprove", "TmQueued", "TmLocked", "TmOneDay", "TmLeave"].map(
        (employee) => ({ employee, weeksAgo: 1, status: "pending" }),
      ),
      { employee: "TmOld", weeksAgo: "pastBackdateLimit", status: "pending" },
      { employee: "MANAGER", weeksAgo: 2, status: "pending" },
      { employee: "EMP", weeksAgo: 4, status: "pending" },
    ],
  },
};
