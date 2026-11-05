const {
  getDateForWeekday,
  getFormattedDate,
} = require("../../utils/dateUtils");

// One seeded project per test case. The tasks are created by the test, so each starts from a known list.
const project = (n, overrides = {}) => ({
  payloadCreateProject: {
    project_name: `TC${n} Project`,
    company: "rtCamp Solutions Pvt. Ltd.",
    customer: "Acme Corporation",
    billing_type: "Fixed Cost",
    currency: "INR",
    project_type: "Fixed Cost",
    business_unit: "Jupiter",
    estimated_cost: 20000,
    custom_default_hourly_billing_rate: 300,
    custom_project_budget_hours: [],
    ...overrides,
  },
  payloadDeleteProject: {
    projectId: "filled-automatically-from-createProjects",
  },
});

// A second project, for the cases that tell two projects apart.
const otherProject = (n) => ({
  payloadCreateProject2: {
    ...project(n).payloadCreateProject,
    project_name: `TC${n} Other Project`,
  },
  payloadDeleteProject2: {
    projectId: "filled-automatically-from-createProjects",
  },
});

// Share the project with employees, so they see its tasks.
const shareWith = (...emails) => ({
  payloadShareProject: emails.map((user) => ({
    doctype: "Project",
    name: "filled-automatically-from-createProjects",
    user,
    readValue: 1,
    writeValue: 1,
    submitValue: 0,
    shareValue: 0,
    notifyValue: 1,
  })),
});

// The project the time-entry cases use, as TC23 does.
const nonBillableProject = (n) =>
  project(n, {
    billing_type: "Non-Billable",
    project_type: "Non Billable",
    business_unit: "NB",
    estimated_cost: 100000,
  });

// This week's Monday, which is never ahead of today, so the popup's last 15 days include it.
const MONDAY = getFormattedDate(getDateForWeekday("Mon"));

// A task with time from two employees, one shared with both: the task popup's team log.
const popupCase = (n) => ({
  ...nonBillableProject(n),
  ...shareWith(process.env.EMP_EMAIL, process.env.EMP3_EMAIL),
  payloadCreateTask: {
    subject: `TC${n} Task`,
    project: "filled-automatically-from-createProjects",
    description: `Task for TC${n} created through automation`,
    custom_is_billable: 0,
  },
  payloadDeleteTask: { taskID: "filled-automatically-from-createTasks" },
  payloadCreateTimesheet: {
    task: "filled-automatically-from-createTasks",
    description: `<p>TC${n} - time of the first employee.</p>`,
    hours: "2",
    date: MONDAY,
    employee: process.env.EMP_ID,
  },
  payloadCreateTimesheet2: {
    task: "filled-automatically-from-createTasks",
    description: `<p>TC${n} - time of the second employee.</p>`,
    hours: "3",
    date: MONDAY,
    employee: process.env.EMP3_ID,
  },
});

module.exports = {
  TC168: { ...project(168), task: "TC168 Task" },
  TC169: { ...project(169), task: "TC169 Task" },
  TC170: {
    ...project(170),
    task: "TC170 Searchable task",
    decoy: "TC170 Something else",
    unknown: "TC170 nothing has this subject",
  },
  TC171: {
    ...project(171),
    ...otherProject(171),
    first: "TC171 Task in the first project",
    second: "TC171 Task in the second project",
    search: "TC171 Task",
  },
  TC172: { ...project(172), task: "TC172 Task" },
  TC173: { ...project(173), task: "TC173 Task" },
  TC174: { ...project(174), task: "TC174 Task" },
  TC175: {
    ...project(175),
    ...otherProject(175),
    task: "TC175 Task",
    search: "TC175 Task",
  },
  TC176: { ...project(176), task: "TC176 Task" },
  TC177: { ...project(177), task: "TC177 Task" },
  TC178: { ...project(178), task: "TC178 Task" },
  TC179: { ...project(179), task: "TC179 Task" },
  TC180: {},
  TC181: {
    ...project(181),
    subject: "TC181 Task with a priority and a due date",
    description: "TC181 description of the work",
  },
  TC182: {
    ...project(182),
    subject: "TC182 Task that fails to save",
    description: "TC182 description of the work",
  },
  TC183: {
    ...nonBillableProject(183),
    ...shareWith(process.env.EMP_EMAIL),
    task: "TC183 Task",
    comment: "TC183 time logged from the row's clock",
  },
  TC184: { ...project(184), task: "TC184 Task" },
  TC185: {
    ...project(185),
    task: "TC185 Task",
    description: "TC185 description of the work",
  },
  TC186: {
    ...project(186),
    task: "TC186 Task",
    newSubject: "TC186 Task after the edit",
    newDescription: "TC186 description after the edit",
  },
  TC187: { ...project(187), task: "TC187 Task" },
  TC188: {
    ...project(188),
    othersTask: "TC188 Task owned by someone else",
    ownTask: "TC188 Task owned by the manager",
  },
  TC189: {
    ...project(189),
    ...shareWith(process.env.EMP_EMAIL),
    othersTask: "TC189 Task owned by someone else",
    ownTask: "TC189 Task added by the employee",
    description: "TC189 description of the work",
  },
  TC190: popupCase(190),
  TC191: popupCase(191),
};
