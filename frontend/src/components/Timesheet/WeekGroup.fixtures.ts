import type {
  TimeEntry,
  TimesheetHoliday,
  TimesheetLeave,
  TimesheetTask,
  TimesheetTasks,
} from "./types";

export const WEEK_DATES = [
  "2025-12-29",
  "2025-12-30",
  "2025-12-31",
  "2026-01-01",
  "2026-01-02",
  "2026-01-03",
  "2026-01-04",
];

function entry(
  name: string,
  task: string,
  date: string,
  hours: number,
  extra: Partial<TimeEntry> = {},
): TimeEntry {
  return {
    name,
    parent: `TS-${date}`,
    task,
    hours,
    rejected_hours: 0,
    description: `<p>Worked on ${task}</p>`,
    is_billable: 1,
    from_time: `${date} 09:00:00`,
    docstatus: 0,
    custom_approval_status: null,
    ...extra,
  };
}

/** Mon approved, Tue pending, Wed two entries, Fri rejected. */
export const RESPONSIVENESS_TASK: TimesheetTask = {
  name: "TASK-001",
  subject: "UI Responsiveness Testing",
  project: "PROJ-1",
  project_name: "Blue Harbour CMS Migration",
  is_billable: true,
  expected_time: 12,
  actual_time: 9.75,
  status: "Working",
  due_date: "2026-01-30",
  data: [
    entry("TD-1", "TASK-001", WEEK_DATES[0], 2, {
      docstatus: 1,
      custom_approval_status: "Approved",
    }),
    entry("TD-2", "TASK-001", WEEK_DATES[1], 3, {
      custom_approval_status: "Approval Pending",
    }),
    entry("TD-3", "TASK-001", WEEK_DATES[2], 1.5),
    entry("TD-4", "TASK-001", WEEK_DATES[2], 0.5),
    entry("TD-5", "TASK-001", WEEK_DATES[4], 0, {
      rejected_hours: 2,
      custom_approval_status: "Rejected",
      custom_rejection_reason: "Logged on the wrong task",
    }),
  ],
};

/** Non-billable, an hour on Tuesday. */
export const DOCS_TASK: TimesheetTask = {
  name: "TASK-002",
  subject: "API Documentation",
  project: "PROJ-1",
  project_name: "Blue Harbour CMS Migration",
  is_billable: false,
  expected_time: 4,
  actual_time: 1,
  status: "Open",
  data: [entry("TD-6", "TASK-002", WEEK_DATES[1], 1, { is_billable: 0 })],
};

/** Four hours on Thursday, on another project. */
export const TRIAGE_TASK: TimesheetTask = {
  name: "TASK-003",
  subject: "Bug triage",
  project: "PROJ-2",
  project_name: "Atlas UI Stabilization",
  is_billable: true,
  expected_time: 6,
  actual_time: 4,
  status: "Completed",
  data: [entry("TD-7", "TASK-003", WEEK_DATES[3], 4)],
};

export const TASKS: TimesheetTasks = {
  [RESPONSIVENESS_TASK.name]: RESPONSIVENESS_TASK,
  [DOCS_TASK.name]: DOCS_TASK,
  [TRIAGE_TASK.name]: TRIAGE_TASK,
};

/** Half a day off on Wednesday. */
export const LEAVES: TimesheetLeave[] = [
  {
    name: "HR-LAP-001",
    from_date: WEEK_DATES[2],
    to_date: WEEK_DATES[2],
    status: "Approved",
    half_day: true,
    half_day_date: WEEK_DATES[2],
    leave_type: "Casual Leave",
    is_lwp: false,
    includes_holidays: false,
  },
];

/** New Year's Day on Thursday, and the weekend off. */
export const HOLIDAYS: TimesheetHoliday[] = [
  {
    holiday_date: WEEK_DATES[3],
    description: "<p>New Year's Day</p>",
    weekly_off: false,
  },
  { holiday_date: WEEK_DATES[5], description: "Saturday", weekly_off: true },
  { holiday_date: WEEK_DATES[6], description: "Sunday", weekly_off: true },
];

export const WEEKEND_ONLY: TimesheetHoliday[] = HOLIDAYS.slice(1);
