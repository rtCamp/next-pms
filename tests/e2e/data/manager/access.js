const COMPANY = "rtCamp Solutions Pvt. Ltd.";
const PREFIX = "E2E Access";
const TASK = `${PREFIX} task`;

// One fixture, read by the Access & Roles and Global & Navigation cases (TC388 to TC405).
// Each persona is an employee with a login user holding one role, so the shared accounts'
// roles and sessions stay as they are; none reports to the manager.
const persona = (roles) => ({ managed: false, user: { roles } });

module.exports = {
  TC388: {
    payloadCreateProject: {
      project_name: `${PREFIX} Project`,
      company: COMPANY,
      customer: "QA-INR",
      project_type: "Fixed Cost",
      custom_project_manager: process.env.REP_MAN_EMAIL,
      // A past report for TC417 to list.
      custom_enable_project_report_generation: 1,
      custom_project_reports: [
        {
          run_id: "e2e-access-report",
          status: "Done",
          report_link: "https://example.com/e2e-access-report",
          date_range: "2026-06-01 - 2026-06-15",
          generated_on: "2026-06-16",
        },
      ],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateWeekEmployees: {
      AcSysMgr: persona(["System Manager"]),
      AcLeader: persona(["PMS Leadership"]),
      AcProjMgr: persona(["Projects Manager"]),
      AcProjUser: persona(["Projects User"]),
      // Reports to the Projects User, with a week for them to approve.
      AcMember: { managed: false, weekendsOff: true, reportsTo: "AcProjUser" },
      // Logs time on the project without reporting to anyone here (TC416).
      AcProjMember: { managed: false, weekendsOff: true },
    },
    // A user with no Employee record behind it.
    payloadCreateUsers: { AcNoEmployee: { roles: ["Employee"] } },
    payloadCreateWeekTime: [
      {
        employee: "AcMember",
        project: "",
        subject: TASK,
        weeksAgo: 1,
        hours: 1,
        role: "admin",
      },
      {
        employee: "AcProjMember",
        project: "",
        subject: TASK,
        weeksAgo: 1,
        hours: 1,
        role: "admin",
      },
    ],
    payloadWeekStatus: [
      { employee: "AcMember", weeksAgo: 1, status: "pending" },
      // Goes to the manager as the project's manager.
      { employee: "AcProjMember", weeksAgo: 1, status: "pending" },
    ],
    // Unread, for the Projects Manager persona's tray.
    payloadProjectDocs: [1, 2, 3].map((n) => ({
      doctype: "NextPMS Notifications",
      key: `notification${n}`,
      linkedProject: "",
      userOf: "AcProjMgr",
      title: `${PREFIX} notice ${n} ${Date.now()}`,
      label: `${PREFIX} notification ${n} for the tray`,
      url: "/next-pms/tasks",
    })),
  },

  // What's new (TC422 to TC424): a user of its own, whose last seen release the cases set.
  TC422: {
    payloadCreateWeekEmployees: { WnReader: persona([]) },
  },
};
