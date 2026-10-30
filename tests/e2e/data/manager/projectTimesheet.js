const COMPANY = "rtCamp Solutions Pvt. Ltd.";

const project = (label, postfix = "") => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `TC222 ${label}`,
    company: COMPANY,
    customer: "QA-INR",
    project_type: "Fixed Cost",
    business_unit: "Jupiter",
    custom_project_budget_hours: [],
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
});

// One fixture, read by every Project tab case (TC222 to TC227): five employees who each logged
// a week on the first project, in every status the badge can show, and one who split the week
// across both projects.
module.exports = {
  TC222: {
    ...project("Alpha"),
    ...project("Beta", "2"),
    payloadCreateWeekEmployees: {
      Draft: {},
      Pending: {},
      Approved: {},
      Rejected: {},
      Split: {},
    },
    payloadCreateWeekTime: [
      ...["Draft", "Pending", "Approved", "Rejected"].map((employee) => ({
        employee,
        project: "",
        subject: "TC222 Alpha task",
        weeksAgo: 1,
        hours: 1,
      })),
      // Older than the twelve weeks the tab loads first, so there is more to scroll to.
      {
        employee: "Draft",
        project: "",
        subject: "TC222 Alpha task",
        weeksAgo: 14,
        days: ["Mon"],
        hours: 1,
        role: "admin",
      },
      {
        employee: "Split",
        project: "",
        subject: "TC222 Alpha task",
        weeksAgo: 2,
        hours: 1,
      },
      {
        employee: "Split",
        project: "2",
        subject: "TC222 Beta task",
        weeksAgo: 2,
        hours: 1,
      },
    ],
    payloadWeekStatus: [
      { employee: "Pending", weeksAgo: 1, status: "pending" },
      { employee: "Approved", weeksAgo: 1, status: "approved" },
      { employee: "Rejected", weeksAgo: 1, status: "rejected" },
      { employee: "Split", weeksAgo: 2, status: "pending" },
    ],
  },
};
