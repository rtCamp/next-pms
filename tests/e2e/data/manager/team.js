import { getWeekRange, getFormattedDate } from "../../utils/dateUtils";

module.exports = {
  TC38: {},
  TC39: {
    employees: [process.env.EMP_NAME, process.env.EMP3_NAME],
  },
  TC42: {
    col: "Mon",
  },
  TC43: {},
  // TC59 seeds its own project + billable allocation so the "Allocation Type"
  // filter has something real to match. Without it every filter combination
  // returned an empty grid, and the test's "each filter narrows the result"
  // checks all passed trivially against zero rows - green while verifying
  // nothing.
  //
  // Filter values are pinned to what this employee actually is on the
  // environment (Polaris / L1 - Software Engineer), so the four filters
  // intersect on a real person instead of nobody.
  TC59: {
    employee: process.env.EMP3_NAME,
    businessUnit: "Polaris",
    designation: "L1 - Software Engineer",
    payloadCreateProject: {
      project_name: "TC59 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadShareProject: [
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
    // is_billable: 1 is the whole point - it is what the "Billable" allocation
    // type filter matches on.
    payloadCreateAllocation: {
      allocation_start_date: getFormattedDate(new Date()),
      allocation_end_date: getFormattedDate(new Date()),
      customer: "Acme Corporation",
      employee: process.env.EMP3_ID,
      hours_allocated_per_day: "01",
      is_billable: 1,
      note: "",
      project: "filled-automatically-from-createProjects",
      total_allocated_hours: "01",
      repeat_till_week_count: 0,
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC45: {
    employee: process.env.EMP3_NAME,
  },
  TC47: {
    taskInfo: {
      duration: "1:45",
      project: "TC47 Project",
      task: "TC47 Billable Task",
      desc: "TC47 - Task added via automation.",
      // Verified against the live toast from the review pane's inline edit:
      // "Time entry updated successfully." - lowercase "entry", with the
      // trailing period. (inline-time-entry/index.tsx carries a differently
      // cased string, but that is a different code path.)
      toastNotification: "Time entry updated successfully.",
    },

    cell: {
      rowName: "TC47 Billable Task",
      col: "Wed",
    },
    payloadCreateProject: {
      project_name: "TC47 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC47 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC47 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    // Same reason as TC49: the review pane - the only way to reach a time
    // entry's edit control - is unreachable while the timesheet reads
    // "Not submitted", because the status column renders no control then.
    // Dedicated employee: submitting a shared account's week breaks TC11 and
    // TC6, which both need an unsubmitted timesheet. Swept up at teardown by
    // deleteEmployeeByName() via the "Playwright-" prefix.
    payloadCreateReviewee: {
      first_name: "Playwright-",
      last_name: "",
      status: "",
      gender: "Male",
      date_of_joining: "",
      date_of_birth: "2000-02-01",
      custom_reporting_manager: "",
      reports_to: "",
      leave_approver: "",
      // Required: saving a timesheet runs the costing hook, which throws
      // "Please set salary currency for the employee." without these
      // (project_currency/overrides/timesheet.py). The values are arbitrary -
      // this test asserts on the entry's duration, not on cost.
      ctc: 100000,
      salary_currency: "USD",
    },
    payloadSubmitTimesheet: {
      // employee is pinned by createRevieweeForTestCases.
      approver: process.env.REP_MAN_ID,
      // Submitted as admin on the employee's behalf - the new employee has no
      // login of its own, and submit_for_approval accepts an explicit employee.
      role: "admin",
      notes: "TC47 - submitted by automation so the manager can edit its entries.",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC47 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC47 Billable Task",
      description: "TC47 - Task added via automation.",
      project_name: "TC47 Project",
      max_week: "1",
    },
  },
  TC49: {
    reason: "TC49 - Timesheet rejected via automation.",
    notification:
      "Timesheet approval or rejection has been queued for processing. Please do not make any changes to it. You may continue with other tasks.",
    cell: {
      rowName: "TC49 Billable Task",
      col: "Fri",
    },
    payloadCreateProject: {
      project_name: "TC49 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC49 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC49 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    // The team grid renders a status control only for a *reviewable* timesheet.
    // Left at "Not submitted" the status column is empty, so there is nothing
    // to click to open the review pane and the rejection cannot be driven.
    // Submitting it as the employee puts it in "Approval pending", which is the
    // state a manager actually rejects from.
    // Dedicated employee: submitting a shared account's week breaks TC11 and
    // TC6, which both need an unsubmitted timesheet. Swept up at teardown by
    // deleteEmployeeByName() via the "Playwright-" prefix.
    payloadCreateReviewee: {
      first_name: "Playwright-",
      last_name: "",
      status: "",
      gender: "Male",
      date_of_joining: "",
      date_of_birth: "2000-02-01",
      custom_reporting_manager: "",
      reports_to: "",
      leave_approver: "",
      // Required: saving a timesheet runs the costing hook, which throws
      // "Please set salary currency for the employee." without these
      // (project_currency/overrides/timesheet.py). The values are arbitrary -
      // this test asserts on the entry's duration, not on cost.
      ctc: 100000,
      salary_currency: "USD",
    },
    payloadSubmitTimesheet: {
      // employee is pinned by createRevieweeForTestCases.
      approver: process.env.REP_MAN_ID,
      // Submitted as admin on the employee's behalf - the new employee has no
      // login of its own, and submit_for_approval accepts an explicit employee.
      role: "admin",
      notes: "TC49 - submitted by automation so the manager can reject it.",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC49 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC49 Billable Task",
      description: "TC49 - Task added via automation.",
      project_name: "TC49 Project",
      max_week: "1",
    },
  },
  TC50: {
    cell: {
      rowName: "TC50 Billable Task",
      col: "Fri",
    },
    payloadCreateProject: {
      project_name: "TC50 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC50 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC50 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC50 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC50 Billable Task",
      description: "TC50 - Task added via automation.",
      project_name: "TC50 Project",
      max_week: "1",
    },
  },
  TC53: {
    // Aishwarrya Pande was moved under this manager in the org chart; she shows
    // in the team view for real, so the expected roster has to carry her.
    employeesInQE: [process.env.EMP_NAME, process.env.EMP3_NAME, "Aishwarrya Pande"],
    employeesInStaging: [
      process.env.EMP_NAME,
      process.env.EMP3_NAME,
      process.env.REP_MAN_NAME,
      "Aishwarrya Pande",
      "Juhi Saxena",
      process.env.EMP2_NAME,
      "Pavan Patil",
      "Renish Vimalbhai Surani",
      "Shraddha Gore",
    ],
  },
  TC60: {
    cell: {
      rowName: "TC60 Project",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC60 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      billing_type: "Fixed Cost",
      currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC60 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC60 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC60 - Task added via automation.</p>",
      hours: "5",
    },
    payloadFilterTimeEntry: {
      subject: "TC60 Billable Task",
      description: "TC60 - Task added via automation.",
      project_name: "TC60 Project",
      max_week: "1",
    },
  },
  TC61: {
    weeklyTime: "0 / 40",
  },
  TC68: {
    payloadCreateProject: {
      project_name: "TC68 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC91: {
    // The filtered team view only lists members with time logged in the visible
    // week, so each seeded employee needs a timesheet entry or it can never
    // appear - verified: the same employee is invisible with 0 entries and
    // visible with 1. The project and task below exist to give them something
    // to book against; createTimeEntriesForSeededEmployees books one hour for
    // every employee createEmployees made, including the Inactive/Suspended/Left
    // ones, since the test checks all four statuses.
    cell: {
      rowName: "TC91 Task",
      col: "Wed",
    },
    payloadCreateEmployee: {
      first_name: "Playwright-",
      last_name: "",
      status: "",
      gender: "Male",
      date_of_joining: "",
      date_of_birth: "2000-02-01",
      custom_reporting_manager: "",
      reports_to: "",
      leave_approver: "",
      // Saving a timesheet runs the costing hook, which throws "Please set
      // salary currency for the employee." without these.
      ctc: 100000,
      salary_currency: "USD",
    },
    payloadCreateProject: {
      project_name: "TC91 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC91 Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC91 created through automation",
      custom_is_billable: 0,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadFilterTimeEntry: {
      subject: "TC91 Task",
      description: "TC91 - Task added via automation.",
      project_name: "TC91 Project",
      max_week: "1",
    },
  },
  TC92: {
    cell: {
      rowName: "TC92 Billable Task 01",
      col: "Fri",
    },

    payloadCreateProject: {
      project_name: "TC92 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC92 Billable Task 01",
      project: "filled-automatically-from-createProjects",
      description: "Task 01 for TC92 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },

    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC92 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC92 Billable Task 01",
      description: "TC92 - Task added via automation.",
      project_name: "TC92 Project",
      max_week: "1",
    },
    payloadApprovalStatus: {
      empId: process.env.EMP3_ID,
      managerID: process.env.REP_MAN_ID,
      employeeAPI: "employee3",
      approvalStatus: "automatically-filled-from-randomApprovalStatus",
    },
  },
  TC93: {
    projectSharedWithEmps: [process.env.EMP3_NAME, process.env.EMP_NAME],
    payloadCreateProject: {
      project_name: "TC93 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      billing_type: "Non-Billable",
      currency: "INR",
      project_type: "Non Billable",
      business_unit: "NB",
      estimated_cost: 100000,
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    // The project filter matches on Timesheet Detail - who *logged time* on the
    // project, not who it is shared with - so each employee this asserts on
    // needs a real entry. Both book to the same task; only the employee differs.
    // `cell` is what makes updateTimeEntries stamp the date onto them.
    cell: {
      rowName: "TC93 Task",
      col: "Wed",
    },
    payloadCreateTask: {
      subject: "TC93 Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC93 created through automation",
      custom_is_billable: 0,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC93 - Task added via automation.</p>",
      hours: "1",
      employee: process.env.EMP3_ID,
    },
    payloadCreateTimesheet2: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC93 - Task added via automation.</p>",
      hours: "1",
      employee: process.env.EMP_ID,
    },
    payloadFilterTimeEntry: {
      subject: "TC93 Task",
      description: "TC93 - Task added via automation.",
      project_name: "TC93 Project",
      max_week: "1",
    },
    payloadShareProject: [
      {
        doctype: "Project",
        name: "filled-automatically-from-createProjects",
        user: process.env.EMP3_EMAIL,
        readValue: 1,
        writeValue: 1,
        submitValue: 0,
        shareValue: 0,
        notifyValue: 1,
      },
      {
        doctype: "Project",
        name: "filled-automatically-from-createProjects",
        user: process.env.EMP_EMAIL,
        readValue: 1,
        writeValue: 1,
        submitValue: 0,
        shareValue: 0,
        notifyValue: 1,
      },
    ],
  },
  TC94: {
    employeeName: process.env.EMP3_NAME,
    payloadCreateUserGroup: {
      user_group_members: [
        {
          user: "filled-automatically-from-createUserGroupForEmployee",
        },
      ],
      __newname: "filled-automatically-from-createUserGroupForEmployee",
    },
    payloadDeleteUserGroup: {
      name: "filled-automatically-from-createUserGroupForEmployee",
    },
  },
  TC95: {
    payloadCreateProject: {
      project_name: "TC95 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // Second filter value. Must be the business unit of `employee` above, or
    // the two filters cannot intersect on them. Test Employee is Polaris.
    businessUnit: "Polaris",
    // The Project filter matches on Timesheet Detail
    // (filters=[["Timesheet Detail","project","=",...]]), i.e. who *logged
    // time* on the project - not who it is shared with. Sharing alone leaves
    // the filtered grid empty, so the employee needs an actual entry. `cell`
    // is what makes updateTimeEntries stamp the date and employee onto it.
    cell: {
      rowName: "TC95 Billable Task",
      col: "Wed",
    },
    payloadCreateTask: {
      subject: "TC95 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC95 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC95 - Task added via automation.</p>",
      hours: "1",
      // Pinned rather than left to the per-TC default, which is Renish Employee.
      employee: process.env.EMP3_ID,
    },
    payloadFilterTimeEntry: {
      subject: "TC95 Billable Task",
      description: "TC95 - Task added via automation.",
      project_name: "TC95 Project",
      max_week: "1",
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadShareProject: [
      {
        doctype: "Project",
        name: "filled-automatically-from-createProjects",
        user: process.env.EMP3_EMAIL,
        readValue: 1,
        writeValue: 1,
        submitValue: 0,
        shareValue: 0,
        notifyValue: 1,
      },
    ],
  },
  TC102: {
    payloadCreateProject: {
      project_name: "TC102 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC103: {
    payloadCreateProject: {
      project_name: "TC103 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    // The share must name the same employee the test allocates, above -
    // sharing with a different user leaves the dialog answering
    // "No results found" for that employee.
    payloadShareProject: [
      {
        doctype: "Project",
        name: "filled-automatically-from-createProjects",
        user: process.env.EMP_EMAIL,
        readValue: 1,
        writeValue: 0,
        submitValue: 0,
        shareValue: 0,
        notifyValue: 0,
      },
    ],
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC104: {
    payloadCreateProject: {
      project_name: "TC104 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC107: {
    payloadCreateProject: {
      project_name: "TC107 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC108: {
    payloadCreateProject: {
      project_name: "TC108 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    infoPayloadCreateAllocation: {
      employee: process.env.EMP3_NAME,
      project_name: "TC108 Project",
      customer: "Acme Corporation",
      start_date: getWeekRange().monday,
      end_date: getWeekRange().friday,
    },
  },
  TC109: {
    payloadCreateProject: {
      project_name: "TC109 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC110: {
    payloadCreateProject: {
      project_name: "TC110 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
  TC111: {
    payloadCreateProject: {
      project_name: "TC111 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Acme Corporation",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    employee: process.env.EMP3_NAME,
    // The allocation dialog only lists a project's assigned team members, which
    // the backend resolves from DocShare, so without this share no employee can
    // be selected ("This project doesn't have any assigned team members").
    payloadShareProject: [
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
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
  },
};
