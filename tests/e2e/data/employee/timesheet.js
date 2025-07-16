module.exports = {
  TC2: {
    cell: {
      rowName: "Task for TC02",
    },
    payloadCreateProject: {
      project_name: "TC02 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      billing_type: "Non-Billable",
      currency: "INR",
      project_type: "Non Billable",
      business_unit: "NB",
      estimated_cost: 100000,
    },
    payloadShareProject: [
      {
        doctype: "Project",
        name: "filled-automatically-from-createProjects",
        user: process.env.EMP2_EMAIL,
        readValue: 1,
        writeValue: 1,
        submitValue: 0,
        shareValue: 0,
        notifyValue: 1,
      },
    ],
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "Task for TC02",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC02 created through automation",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    taskInfo: {
      duration: "1:00",
      project: "TC02 Project",
      task: "Task for TC02",
      desc: "Task for TC02 created through automation",
    },
    payloadFilterTimeEntry: {
      subject: "Task for TC02",
      description: "Task for TC02 created through automation",
      project_name: "TC02 Project",
      max_week: "1",
    },
  },
  TC3: {
    notification: "New Timesheet created successfully.",
    cell: {
      rowName: "Task for TC03",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC03 Project",
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
    payloadCreateTask: {
      subject: "Task for TC03",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC03 created through automation",
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    taskInfo: {
      duration: "1:00",
      project: "TC03 Project",
      task: "Task for TC03",
      desc: "Task for TC03 created through automation",
    },
    payloadFilterTimeEntry: {
      subject: "Task for TC03",
      description: "Task for TC03 created through automation",
      project_name: "TC03 Project",
      max_week: "1",
    },
  },
  TC4: {
    cell: {
      rowName: "Task for TC04",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC04 Project",
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
    payloadCreateTask: {
      subject: "Task for TC04",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC04 created through automation",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    taskInfo: {
      duration: "0:30",
      project: "TC04 Project",
      task: "Task for TC04",
      desc: "TC4 - Updated task via automation.",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC4 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry2: {
      subject: "Task for TC04",
      description: "TC4 - Updated task via automation.",
      project_name: "TC04 Project",
      max_week: "1",
    },
  },
  TC5: {
    cell: {
      rowName: "Task for TC05",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC05 Project",
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
    payloadCreateTask: {
      subject: "Task for TC05",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC05 created through automation",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    taskInfo: {
      duration: "2:15",
      project: "TC05 Project",
      task: "Task for TC05",
      desc: "TC5 - New row added to task via automation.",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC5 - Task added via automation.</p>",
      hours: "1",
    },

    payloadFilterTimeEntry1: {
      subject: "Task for TC05",
      description: "TC5 - Task added via automation.",
      project_name: "TC05 Project",
      max_week: "1",
    },

    payloadFilterTimeEntry2: {
      subject: "Task for TC05",
      description: "TC5 - New row added to task via automation.",
      project_name: "TC05 Project",
      max_week: "1",
    },
  },
  TC6: {
    cell: {
      rowName: "Task for TC06",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC06 Project",
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
    payloadCreateTask: {
      subject: "Task for TC06",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC06 created through automation",
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee3",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    taskInfo: {
      duration: "1",
      project: "TC06 Project",
      task: "Task for TC06",
      desc: "TC6 - Task added via automation.",
      isLikeTask: true,
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC6 - Task added via automation.</p>",
      hours: "1",
    },
    /*
    payloadFilterTimeEntry: {
      subject: "Task for TC06",
      description: "TC6 - Task added via automation.",
      project_name: "TC06 Project",
      max_week: "1",
    },
    */
  },
  TC7: {
    cell: {
      rowName: "Task for TC07",
      col: "Mon",
    },
    payloadCreateProject: {
      project_name: "TC07 Project",
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
    payloadCreateTask: {
      subject: "Task for TC07",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC07 created through automation",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC7 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "Task for TC07",
      description: "TC7 - Task added via automation.",
      project_name: "TC07 Project",
      max_week: "1",
    },
  },
  TC9: {
    cell: {
      rowName: "Task for TC09",
      col: "Wed",
    },
    payloadCreateProject: {
      project_name: "TC09 Project",
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
    payloadCreateTask: {
      subject: "Task for TC09",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC09 created through automation",
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC9 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "Task for TC09",
      description: "TC9 - Task added via automation.",
      project_name: "TC09 Project",
      max_week: "1",
    },
  },
  TC12: {
    tasks: [],
  },
  TC13: {
    cell: {
      rowName: "Time Off",
    },
    leave: {
      desc: "TC13 - Leave added via automation.",
    },
    payloadFilterLeaveEntry: {
      description: "TC13 - Leave added via automation.",
      status: "Open",
      leave_type: "Unpaid Time Off",
    },
  },
  TC14: {
    cell: {
      rowName: "TC14 Billable Task",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC14 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Fixed Cost",
      currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC14 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC14 created through automation",
      custom_is_billable: 1,
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC14 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC14 Billable Task",
      description: "TC14 - Task added via automation.",
      project_name: "TC14 Project",
      max_week: "1",
    },
  },
  TC15: {
    cell: {
      rowName: "TC15 Non-Billable Task",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC15 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Fixed Cost",
      currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC15 Non-Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC15 created through automation",
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC15 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC15 Non-Billable Task",
      description: "TC15 - Task added via automation.",
      project_name: "TC15 Project",
      max_week: "1",
    },
  },
  TC23: {
    projectSharedWithEmps: [process.env.EMP_NAME],
    payloadCreateProject: {
      project_name: "TC23 Project",
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
    payloadCreateTask: {
      subject: "TC23 Task 01",
      project: "filled-automatically-from-createProjects",
      description: "Task 01 for TC23 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadShareProject: [
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
  TC52: {},
  TC82: {
    cell: {
      rowName: "TC82 Billable Task",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC82 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
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
      subject: "TC82 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC82 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC82 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC82 Billable Task",
      description: "TC82 - Task added via automation.",
      project_name: "TC82 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC83: {
    cell: {
      rowName: "TC83 Billable Task",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC83 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "QA-INR",
      custom_currency: "INR",
      billing_type: "Retainer",
      project_type: "Retainer",
      business_unit: "Jupitor",
      estimated_costing: 245000,
      custom_billing_type: "Retainer",
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC83 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC83 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC83 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC83 Billable Task",
      description: "TC83 - Task added via automation.",
      project_name: "TC83 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC84: {
    cell: {
      rowName: "TC84 Billable Task",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC84 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Time and Material",
      project_type: "TnM",
      business_unit: "Jupitor",
      estimated_costing: 245000,
      custom_billing_type: "Time and Material",
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC84 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC84 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC84 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC84 Billable Task",
      description: "TC84 - Task added via automation.",
      project_name: "TC84 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC85: {
    cell: {
      rowName: "TC85 Billable Task",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC85 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "QA-INR",
      custom_currency: "INR",
      billing_type: "Retainer",
      project_type: "Retainer",
      business_unit: "Jupitor",
      estimated_costing: 245000,
      custom_billing_type: "Retainer",
      custom_default_hourly_billing_rate: 0,
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC85 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC85 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC85 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC85 Billable Task",
      description: "TC85 - Task added via automation.",
      project_name: "TC85 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC86: {
    cell: {
      rowName: "TC86 Billable Task",
      col: "Thu",
    },
    payloadCreateProject: {
      project_name: "TC86 Project",
      project_type: "TnM",
      custom_billing_type: "Time and Material",
      custom_currency: "INR",
      estimated_costing: 45000,
      company: "rtCamp Solutions Pvt. Ltd.",
      custom_project_billing_team: [
        {
          user_name: process.env.EMP_NAME,
          employee: process.env.EMP_ID,
          hourly_billing_rate: 1500,
          valid_from: "2025-04-10",
        },
      ],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC86 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC86 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC86 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC86 Billable Task",
      description: "TC86 - Task added via automation.",
      project_name: "TC86 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC87: {
    cell: {
      rowName: "TC87 Billable Task",
      col: "Mon",
    },
    payloadCreateProject: {
      project_name: "TC87 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "QA-INR",
      custom_currency: "INR",
      billing_type: "Fixed Cost",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_costing: 245000,
      custom_billing_type: "Fixed Cost",
      custom_default_hourly_billing_rate: 1500,
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC87 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC87 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC87 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC87 Billable Task",
      description: "TC87 - Task added via automation.",
      project_name: "TC87 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC88: {
    cell: {
      rowName: "TC88 Billable Task",
      col: "Mon",
    },
    payloadCreateProject: {
      project_name: "TC88 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "QA-INR",
      custom_currency: "INR",
      billing_type: "Retainer",
      project_type: "Retainer",
      business_unit: "Jupitor",
      estimated_costing: 245000,
      custom_billing_type: "Retainer",
      custom_default_hourly_billing_rate: 2000,
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC88 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC88 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC88 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC88 Billable Task",
      description: "TC88 - Task added via automation.",
      project_name: "TC88 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC89: {
    cell: {
      rowName: "TC89 Billable Task",
      col: "Mon",
    },
    payloadCreateProject: {
      project_name: "TC89 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "QA-INR",
      custom_currency: "INR",
      billing_type: "Time and Material",
      project_type: "TnM",
      business_unit: "Jupitor",
      estimated_costing: 245000,
      custom_billing_type: "Time and Material",
      custom_default_hourly_billing_rate: 2000,
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC89 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC89 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC89 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC89 Billable Task",
      description: "TC89 - Task added via automation.",
      project_name: "TC89 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC90: {
    cell: {
      rowName: "TC90 Billable Task",
      col: "Wed",
    },
    payloadCreateProject: {
      project_name: "TC90 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      custom_billing_type: "Fixed Cost",
      custom_currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 360000,
      custom_default_hourly_billing_rate: 0,
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC90 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC90 created through automation",
      custom_is_billable: 1,
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC90 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC90 Billable Task",
      description: "TC90 - Task added via automation.",
      project_name: "TC90 Project",
      max_week: "1",
    },
    payloadCalculateBillingRate: {
      project: "filled-automatically-from-createProjects",
      custom_currency_for_project: "filled-automatically-from-createProjects",
      total_billable_amount: 0,
      total_costing_amount: 0,
      hourly_billing_rate: 0,
    },
  },
  TC96: {
    cell: {
      rowName: "TC96 Billable Task",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC96 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Retainer",
      currency: "INR",
      project_type: "Retainer",
      business_unit: "Jupitor",
      estimated_cost: 350000,
      custom_default_hourly_billing_rate: 300,
      custom_billing_type: "Retainer",
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC96 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC96 created through automation",
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC96 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC96 Billable Task",
      description: "TC96 - Task added via automation.",
      project_name: "TC96 Project",
      max_week: "1",
    },
  },
  TC97: {
    cell: {
      rowName: "TC97 Billable Task",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC97 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Time and Material",
      currency: "INR",
      project_type: "TnM",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_billing_type: "Time and Material",
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC97 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC97 created through automation",
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC97 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC97 Billable Task",
      description: "TC97 - Task added via automation.",
      project_name: "TC97 Project",
      max_week: "1",
    },
  },
  TC98: {
    cell: {
      rowName: "TC98 Billable Task",
      col: "Wed",
    },
    payloadCreateProject: {
      project_name: "TC98 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Non-Billable",
      currency: "INR",
      project_type: "Non Billable",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_billing_type: "Non-Billable",
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC98 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC98 created through automation",
      custom_is_billable: 1,
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC98 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC98 Billable Task",
      description: "TC98 - Task added via automation.",
      project_name: "TC98 Project",
      max_week: "1",
    },
  },
  TC99: {
    cell: {
      rowName: "TC99 Billable Task",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC99 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Fixed Cost",
      currency: "INR",
      project_type: "Fixed Cost",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_billing_type: "Fixed Cost",
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC99 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC99 created through automation",
    },
    payloadUpdateTask: {
      custom_is_billable: 0,
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC99 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC99 Billable Task",
      description: "TC99 - Task added via automation.",
      project_name: "TC99 Project",
      max_week: "1",
    },
  },
  TC100: {
    cell: {
      rowName: "TC100 Billable Task",
      col: "Wed",
    },
    payloadCreateProject: {
      project_name: "TC100 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Retainer",
      currency: "INR",
      project_type: "Retainer",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_billing_type: "Retainer",
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC100 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC100 created through automation",
    },
    payloadUpdateTask: {
      custom_is_billable: 0,
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC100 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC100 Billable Task",
      description: "TC100 - Task added via automation.",
      project_name: "TC100 Project",
      max_week: "1",
    },
  },
  TC101: {
    cell: {
      rowName: "TC101 Billable Task",
      col: "Tue",
    },
    payloadCreateProject: {
      project_name: "TC101 Project",
      company: "rtCamp Solutions Pvt. Ltd.",
      customer: "Google",
      billing_type: "Time and Material",
      currency: "INR",
      project_type: "TnM",
      business_unit: "Jupitor",
      estimated_cost: 235000,
      custom_default_hourly_billing_rate: 300,
      custom_billing_type: "Time and Material",
      custom_project_budget_hours: [],
    },
    payloadDeleteProject: {
      projectId: "filled-automatically-from-createProjects",
    },
    payloadCreateTask: {
      subject: "TC101 Billable Task",
      project: "filled-automatically-from-createProjects",
      description: "Task for TC101 created through automation",
    },
    payloadUpdateTask: {
      custom_is_billable: 0,
    },
    payloadLikeTask: {
      doctype: "Task",
      name: "filled-automatically-from-createTasks",
      add: "Yes",
      role: "employee",
    },
    payloadDeleteTask: {
      taskID: "filled-automatically-from-createTasks",
    },
    payloadCreateTimesheet: {
      task: "filled-automatically-from-createTasks",
      description: "<p>TC101 - Task added via automation.</p>",
      hours: "1",
    },
    payloadFilterTimeEntry: {
      subject: "TC101 Billable Task",
      description: "TC101 - Task added via automation.",
      project_name: "TC101 Project",
      max_week: "1",
    },
  },
};
