import { dateInWeek } from "../../utils/dateUtils";

const COMPANY = "rtCamp Solutions Pvt. Ltd.";
const PREFIX = "E2E Db";
// The calendar steps 14 days from this week's Monday; 13 steps land on week 26 ahead,
// a window no one else loads, so its per-user cache holds only these milestones.
const CALENDAR_STEPS = 13;
const CALENDAR_WEEK = -2 * CALENDAR_STEPS;

const project = (postfix, label, extra = {}) => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `${PREFIX} ${label}`,
    company: COMPANY,
    customer: "QA-INR",
    custom_project_phase: "Delivery Prep",
    custom_project_manager: process.env.REP_MAN_EMAIL,
    project_type: "Fixed Cost",
    ...extra,
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
});

const milestone = (postfix, label) => ({
  doctype: "Project Timeline Item",
  key: `milestone${label}`,
  project: postfix,
  type: "Milestone",
  title: `${PREFIX} milestone ${label}`,
  start_date: dateInWeek(CALENDAR_WEEK, "Wed"),
  planned_end_date: dateInWeek(CALENDAR_WEEK, "Fri"),
  item_owner: process.env.REP_MAN_EMAIL,
});

// One fixture, read by every Dashboard case (TC359 to TC378). The employees report to
// the manager, so they show in Upcoming time-offs and the Timesheets panel.
module.exports = {
  TC359: {
    ...project("", "Red", { custom_project_rag_status: "Red" }),
    ...project("2", "Amber", {
      custom_project_rag_status: "Amber",
      customer: "QA-USD",
    }),
    payloadCreateWeekEmployees: {
      // One default heatmap role and one that is not, so its rows are known on CI.
      DbOpen: { designation: `${PREFIX} Analyst` },
      DbApprove: { designation: "L1 - Software Engineer" },
      DbReject: {},
      DbAway: {},
    },
    payloadCreateWeekTime: [
      {
        employee: "DbOpen",
        project: "",
        subject: `${PREFIX} review task`,
        weeksAgo: 0,
        days: ["Mon"],
        hours: 2,
      },
    ],
    payloadWeekStatus: [{ employee: "DbOpen", weeksAgo: 0, status: "pending" }],
    payloadWeekLeave: [
      {
        key: "open",
        employee: "DbOpen",
        weeksAgo: -3,
        day: "Mon",
        toDay: "Tue",
        reason: `${PREFIX} open leave`,
      },
      {
        key: "approve",
        employee: "DbApprove",
        weeksAgo: -3,
        day: "Wed",
        reason: `${PREFIX} leave to approve`,
      },
      {
        key: "reject",
        employee: "DbReject",
        weeksAgo: -3,
        day: "Mon",
        toDay: "Wed",
        reason: `${PREFIX} leave to reject`,
      },
      {
        employee: "DbAway",
        weeksAgo: -2,
        day: "Thu",
        toDay: "Fri",
        reason: `${PREFIX} approved leave`,
        status: "approved",
      },
    ],
    payloadProjectDocs: [
      milestone("", "Red"),
      milestone("2", "Amber"),
      {
        doctype: "NextPMS Notifications",
        key: "notification",
        linkedProject: "",
        user: process.env.REP_MAN_EMAIL,
        title: `${PREFIX} notice ${Date.now()}`,
        label: `${PREFIX} notification for the dashboard`,
        url: "/next-pms/tasks",
      },
      // Stays unread: a fresh site has no other, and the card would be empty once the first is read.
      {
        doctype: "NextPMS Notifications",
        key: "notification2",
        linkedProject: "",
        user: process.env.REP_MAN_EMAIL,
        title: `${PREFIX} second notice ${Date.now()}`,
        label: `${PREFIX} second notification for the dashboard`,
        url: "/next-pms/tasks",
      },
    ],
  },
};
