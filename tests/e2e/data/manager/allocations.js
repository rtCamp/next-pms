const COMPANY = "rtCamp Solutions Pvt. Ltd.";

const project = (label, postfix, extra = {}) => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `E2E Alloc ${label}`,
    company: COMPANY,
    customer: "QA-INR",
    business_unit: "Jupiter",
    custom_project_budget_hours: [],
    ...extra,
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
  // The Add allocation dialog lists only the employees a project is shared with.
  [`payloadShareProject${postfix}`]: [
    process.env.EMP3_EMAIL,
    process.env.EMP2_EMAIL,
  ].map((user) => ({
    doctype: "Project",
    name: "filled-automatically-from-createProjects",
    user,
    readValue: 1,
    writeValue: 0,
    submitValue: 0,
    shareValue: 0,
    notifyValue: 0,
  })),
});

// No reporting manager: these stay out of TC53's roster; the specs find them by search.
const member = (options = {}) => ({ managed: false, ...options });

// One fixture, read by every Allocations case (TC265 to TC296). Allocations sit two and
// three weeks ahead, inside every default view and clear of other tests' near dates.
module.exports = {
  TC265: {
    ...project("Alpha", "", {
      project_type: "Fixed Cost",
      custom_project_manager: process.env.REP_MAN_EMAIL,
    }),
    ...project("Beta", "2", { project_type: "Retainer" }),
    payloadProjectTags: [{ project: "2", tag: "e2e-alloc" }],
    payloadCreateWeekEmployees: {
      AlDev: member({
        designation: "E2E Developer",
        department: "E2E Engineering",
        skills: ["E2E Playwright"],
      }),
      AlQa: member({
        designation: "E2E Tester",
        department: "E2E Quality",
        skills: ["E2E Manual"],
      }),
      AlIdle: member(),
      AlDelete: member(),
      AlDrag: member(),
    },
    payloadWeekAllocations: [
      {
        employee: "AlDev",
        project: "",
        weeksAgo: -2,
        hours: 4,
        note: "TC265 seeded allocation",
      },
      {
        employee: "AlQa",
        project: "2",
        weeksAgo: -2,
        hours: 2,
        billable: false,
        tentative: true,
      },
      {
        employee: "AlDelete",
        project: "",
        weeksAgo: -2,
        from: "Wed",
        to: "Wed",
        hours: 8,
      },
      {
        employee: "AlDrag",
        project: "2",
        weeksAgo: -2,
        from: "Thu",
        to: "Thu",
        hours: 2,
      },
      // Only project team members can be picked in the dialog or have their schedule
      // edited, so EMP3 gets a full day on Beta (over-allocation) and a day on Alpha
      // (overlap), and EMP2, who has no leave ahead on staging, a weekly Alpha series.
      {
        employee: "EMP3",
        project: "2",
        weeksAgo: -3,
        from: "Tue",
        to: "Tue",
        hours: 8,
      },
      {
        employee: "EMP3",
        project: "",
        weeksAgo: -3,
        from: "Wed",
        to: "Wed",
        hours: 2,
      },
      {
        employee: "EMP2",
        project: "",
        weeksAgo: -5,
        hours: 2,
        repeatWeeks: 1,
      },
    ],
  },
};
