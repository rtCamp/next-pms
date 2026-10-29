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
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateWeekEmployees: {
      AcSysMgr: persona(["System Manager"]),
      AcDelMgr: persona(["Delivery Manager"]),
      AcTsMgr: persona(["Timesheet Manager"]),
      AcTsUser: persona(["Timesheet User"]),
      AcProjMgr: persona(["Projects Manager"]),
      AcProjUser: persona(["Projects User"]),
      // Has a week for the Timesheet User to approve.
      AcMember: { managed: false, weekendsOff: true },
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
    ],
    payloadWeekStatus: [{ employee: "AcMember", weeksAgo: 1, status: "pending" }],
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
};
