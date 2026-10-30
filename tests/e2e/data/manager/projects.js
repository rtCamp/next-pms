import { getFormattedDate } from "../../utils/dateUtils";

const COMPANY = "rtCamp Solutions Pvt. Ltd.";
const DAY = 24 * 60 * 60 * 1000;
const daysAhead = (days) => getFormattedDate(new Date(Date.now() + days * DAY));

// Every seeded project's name starts with this, so a search narrows the list to them.
const PREFIX = "E2E Prj";

const project = (postfix, label, extra = {}) => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `${PREFIX} ${label}`,
    company: COMPANY,
    customer: "QA-INR",
    custom_project_phase: "Delivery Prep",
    status: "Open",
    custom_project_budget_hours: [],
    ...extra,
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
});

// More than one page of 20 shares the prefix.
const pages = Object.assign(
  {},
  ...Array.from({ length: 18 }, (_, index) =>
    project(`P${index + 1}`, `Page ${String(index + 1).padStart(2, "0")}`),
  ),
);

const view = (postfix, label, extra) => ({
  [`payloadCreateView${postfix}`]: {
    label,
    dt: "Project",
    type: "List",
    icon: "📋",
    default: 0,
    filters: JSON.stringify({
      search: PREFIX,
      rag: null,
      phase: null,
      status: null,
      advanced: "[]",
    }),
    order_by: "[]",
    rows: "[]",
    columns: "{}",
    pinned_columns: "[]",
    ...extra,
  },
  [`payloadDeleteView${postfix}`]: {},
});

// One fixture, read by every Projects case (TC299 to TC358).
module.exports = {
  TC299: {
    ...project("", "Red", {
      custom_project_rag_status: "Red",
      custom_project_phase: "Kick Off",
      custom_project_manager: process.env.REP_MAN_EMAIL,
      project_type: "Fixed Cost",
    }),
    ...project("2", "Amber", {
      custom_project_rag_status: "Amber",
      custom_project_phase: "Development",
      customer: "QA-USD",
      project_type: "Retainer",
    }),
    ...project("3", "Green", {
      custom_project_rag_status: "Green",
      custom_project_phase: "Launch",
      status: "Completed",
    }),
    ...project("4", "Kanban", {
      custom_project_phase: "Discovery",
      // Shown with the colour-coded ones; a card dropped on an empty column stays put.
      custom_project_rag_status: "Green",
    }),
    ...project("5", "Detail", {
      priority: "Medium",
      custom_executive_summary: "<p>E2E Prj detail summary</p>",
      custom_enable_project_report_generation: 1,
      custom_project_reports: [
        {
          run_id: "e2e-prj-report",
          status: "Done",
          report_link: "https://example.com/e2e-prj-report",
          date_range: `${daysAhead(-14)} - ${daysAhead(-7)}`,
          generated_on: daysAhead(-6),
        },
      ],
    }),
    ...pages,
    payloadShareProject5: [
      {
        doctype: "Project",
        name: "filled-automatically-from-createProjects",
        user: process.env.EMP3_EMAIL,
        readValue: 1,
        writeValue: 0,
        submitValue: 0,
        shareValue: 0,
        notifyValue: 0,
      },
    ],
    payloadProjectDocs: [
      {
        doctype: "Risk",
        key: "openRisk",
        project: "5",
        risk_category: "Technical",
        risk_level: "High",
        status: "To-do",
        risk_owner: process.env.REP_MAN_EMAIL,
        summary: "E2E Prj open risk",
        mitigation_plan: "E2E Prj mitigation plan",
      },
      {
        doctype: "Risk",
        key: "mitigatedRisk",
        project: "5",
        risk_category: "Client",
        risk_level: "Low",
        status: "Mitigated",
        summary: "E2E Prj mitigated risk",
      },
      {
        doctype: "Project Timeline Item",
        key: "milestone",
        project: "5",
        type: "Milestone",
        title: "E2E Prj milestone",
        start_date: daysAhead(3),
        planned_end_date: daysAhead(5),
        item_owner: process.env.REP_MAN_EMAIL,
      },
      {
        doctype: "Project Timeline Item",
        key: "touchpoint",
        project: "5",
        type: "Touchpoint",
        title: "E2E Prj touchpoint",
        planned_end_date: daysAhead(4),
        item_owner: process.env.REP_MAN_EMAIL,
      },
      // A fresh site has no contacts; the Customers dialog lists the customer's.
      {
        doctype: "Contact",
        key: "contact",
        reuseBy: "first_name",
        first_name: "E2E Prj Contact",
        links: [{ link_doctype: "Customer", link_name: "QA-INR" }],
      },
    ],
    // Public and owned by Administrator: another PM may only duplicate it.
    ...view("", `${PREFIX} Public View`, { public: 1, user: "" }),
    // Private and owned by the manager.
    ...view("2", `${PREFIX} My View`, {
      public: 0,
      user: process.env.REP_MAN_EMAIL,
      role: "manager",
    }),
  },
};
