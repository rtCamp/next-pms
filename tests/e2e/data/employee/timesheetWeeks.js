const COMPANY = "rtCamp Solutions Pvt. Ltd.";

const project = (tc, label, postfix = "", email = process.env.EMP2_EMAIL) => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `${tc} ${label}`,
    company: COMPANY,
    customer: "QA-INR",
    project_type: "Fixed Cost",
    business_unit: "Jupiter",
    custom_project_budget_hours: [],
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
  // The projects are shared with the employee, or they cannot book time against them.
  [`payloadShareProject${postfix}`]: [
    {
      doctype: "Project",
      name: "filled-automatically-from-createProjects",
      user: email,
      readValue: 1,
      writeValue: 1,
      submitValue: 0,
      shareValue: 0,
      notifyValue: 1,
    },
  ],
});

// TC208 is the fixture every Personal tab case but TC220 reads: time on two projects in the
// three past weeks the first page of the grid shows, left in a different status each.
module.exports = {
  TC208: {
    ...project("TC208", "Alpha"),
    ...project("TC208", "Beta", "2"),
    payloadCreateWeekTime: [
      // Last week: still to submit.
      {
        employee: "EMP2",
        project: "",
        subject: "TC208 Alpha task",
        weeksAgo: 1,
        days: ["Mon"],
        hours: 2,
      },
      {
        employee: "EMP2",
        project: "2",
        subject: "TC208 Beta task",
        weeksAgo: 1,
        days: ["Tue"],
        hours: 3,
      },
      // Two weeks ago: submitted.
      {
        employee: "EMP2",
        project: "",
        subject: "TC208 Alpha task",
        weeksAgo: 2,
        hours: 1,
      },
      // Three weeks ago: approved.
      {
        employee: "EMP2",
        project: "2",
        subject: "TC208 Beta task",
        weeksAgo: 3,
        hours: 1,
      },
    ],
    payloadWeekStatus: [
      { employee: "EMP2", weeksAgo: 2, status: "pending" },
      { employee: "EMP2", weeksAgo: 3, status: "approved" },
    ],
    payloadLikeTasks: [
      { employee: "EMP2", project: "2", subject: "TC208 Liked task" },
    ],
  },
  // The other employee's own week, which the case books and sends for approval itself,
  // so that a retry starts from the same place.
  TC220: {
    ...project("TC220", "Project", "", process.env.EMP_EMAIL),
    payloadCreateTask: {
      subject: "TC220 task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC220 created through automation",
    },
    payloadDeleteTask: { taskID: "filled-automatically-from-createTasks" },
  },
};
