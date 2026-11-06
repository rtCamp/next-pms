const { getFormattedDate } = require("../../utils/dateUtils");

const COMPANY = "rtCamp Solutions Pvt. Ltd.";
const INR_CUSTOMER = "QA-INR";
const USD_CUSTOMER = "QA-USD";

const PROJECT_TYPES = {
  "Fixed Cost": "Fixed Cost",
  Retainer: "Retainer",
  "Time and Material": "TnM",
  "Non-Billable": "Non Billable",
};

// Burn rate is the amount billed since the project started, so start it a few days back.
const startedDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getFormattedDate(date);
};

// A project of one billing type; `postfix` is "" for the first project of a case, "2", "3" for the rest.
const project = (n, label, overrides = {}, postfix = "") => ({
  [`payloadCreateProject${postfix}`]: {
    project_name: `TC${n} ${label}`,
    company: COMPANY,
    customer: INR_CUSTOMER,
    business_unit: "Jupiter",
    custom_billing_type: "Fixed Cost",
    custom_default_hourly_billing_rate: 300,
    custom_project_budget_hours: [],
    ...overrides,
    project_type: PROJECT_TYPES[overrides.custom_billing_type] ?? "Fixed Cost",
  },
  [`payloadDeleteProject${postfix}`]: {
    projectId: "filled-automatically-from-createProjects",
  },
});

const salesOrder = (amount, postfix = "") => ({
  [`payloadCreateSalesOrder${postfix}`]: { amount },
});

const billableTime = (hours, postfix = "") => ({
  [`payloadCreateBillingTime${postfix}`]: [
    { subject: "Billable work", hours, billable: true },
  ],
});

// Share the project with employees, so the Member dropdown of the rates table offers them.
const shareWith = (...emails) => ({
  payloadShareProject: emails.map((user) => ({
    doctype: "Project",
    name: "filled-automatically-from-createProjects",
    user,
    readValue: 1,
    writeValue: 1,
    submitValue: 0,
    shareValue: 0,
    notifyValue: 1,
  })),
});

module.exports = {
  // A project per currency, each with a budget, so the list has something to convert.
  TC192: {
    ...project(192, "INR Project"),
    ...project(192, "USD Project", { customer: USD_CUSTOMER }, "2"),
    ...salesOrder(150000),
    ...salesOrder(10000, "2"),
  },
  // Budget, burn rate and lifetime value on both, in different currencies.
  TC193: {
    ...project(193, "INR Project", {
      expected_start_date: startedDaysAgo(3),
      custom_lifetime_value_to_date: 400000,
    }),
    ...project(
      193,
      "USD Project",
      {
        customer: USD_CUSTOMER,
        custom_default_hourly_billing_rate: 50,
        expected_start_date: startedDaysAgo(3),
        custom_lifetime_value_to_date: 20000,
      },
      "2",
    ),
    ...salesOrder(200000),
    ...salesOrder(10000, "2"),
    ...billableTime(3),
    ...billableTime(2, "2"),
  },
  // 5,000 rupees is worth less than 100 dollars, though it is the bigger number; the same for the burn rates.
  TC194: {
    ...project(194, "INR Project", {
      custom_default_hourly_billing_rate: 500,
      expected_start_date: startedDaysAgo(3),
    }),
    ...project(
      194,
      "USD Project",
      {
        customer: USD_CUSTOMER,
        custom_default_hourly_billing_rate: 20,
        expected_start_date: startedDaysAgo(3),
      },
      "2",
    ),
    ...salesOrder(5000),
    ...salesOrder(100, "2"),
    ...billableTime(1),
    ...billableTime(1, "2"),
  },
  // Nothing set: no target hours, no purchased hours, no estimated cost, no Sales Order.
  TC195: {
    ...project(195, "Fixed Cost Project"),
    ...project(
      195,
      "Retainer Project",
      { custom_billing_type: "Retainer" },
      "2",
    ),
    ...project(
      195,
      "Non-Billable Project",
      { custom_billing_type: "Non-Billable" },
      "3",
    ),
  },
  // Each billing type keeps its hours somewhere else: Target Hours, Total Hours Purchased, Target Hours.
  TC196: {
    ...project(196, "Fixed Cost Project", { custom_target_hours: 100 }),
    ...project(
      196,
      "Retainer Project",
      {
        custom_billing_type: "Retainer",
        custom_default_hourly_billing_rate: 200,
        custom_project_budget_hours: [
          {
            start_date: startedDaysAgo(10),
            end_date: startedDaysAgo(0),
            hours_purchased: 150,
          },
        ],
      },
      "2",
    ),
    ...project(
      196,
      "Time and Material Project",
      { custom_billing_type: "Time and Material", custom_target_hours: 80 },
      "3",
    ),
    ...salesOrder(200000),
    ...salesOrder(60000, "2"),
    ...salesOrder(30000, "3"),
    ...billableTime(3),
    ...billableTime(2, "2"),
    ...billableTime(1, "3"),
  },
  TC197: {
    ...project(197, "Non-Billable Project", {
      custom_billing_type: "Non-Billable",
      estimated_costing: 50000,
    }),
  },
  TC198: {
    ...project(198, "Blank Billing Type Project", { custom_billing_type: "" }),
  },
  // One project of each billing type that has a Financials card.
  TC199: {
    ...project(199, "Fixed Cost Project"),
    ...project(
      199,
      "Retainer Project",
      { custom_billing_type: "Retainer" },
      "2",
    ),
    ...project(
      199,
      "Time and Material Project",
      { custom_billing_type: "Time and Material" },
      "3",
    ),
    ...salesOrder(200000),
    ...salesOrder(60000, "2"),
    ...salesOrder(100000, "3"),
    ...billableTime(3),
    ...billableTime(2, "2"),
    ...billableTime(3, "3"),
  },
  // Time and Material earns per billable hour, so Current differs; Fixed Cost earns the same either way.
  TC200: {
    ...project(200, "Time and Material Project", {
      custom_billing_type: "Time and Material",
      custom_default_hourly_billing_rate: 100,
    }),
    ...project(200, "Fixed Cost Project", {}, "2"),
    ...salesOrder(100000),
    ...salesOrder(200000, "2"),
    ...billableTime(3),
    ...billableTime(3, "2"),
  },
  // Billable, but with no Sales Order, so nothing to take a margin of.
  TC201: {
    ...project(201, "Fixed Cost Project"),
  },
  TC202: {
    ...project(202, "INR Project", {
      custom_target_hours: 40,
      custom_lifetime_value_to_date: 400000,
      custom_expected_lifetime_value: 900000,
      custom_lifetime_value_vs_billed_amount: 12000,
    }),
    ...project(
      202,
      "USD Project",
      {
        customer: USD_CUSTOMER,
        custom_target_hours: 40,
        custom_lifetime_value_to_date: 40000,
        custom_expected_lifetime_value: 90000,
        custom_lifetime_value_vs_billed_amount: 1200,
      },
      "2",
    ),
    ...salesOrder(200000),
    ...salesOrder(10000, "2"),
    ...billableTime(3),
    ...billableTime(3, "2"),
  },
  TC203: {
    ...project(203, "Fixed Cost Project", { custom_target_hours: 40 }),
    payloadCreateBillingTime: [
      { subject: "Billable work", hours: 3, billable: true },
      { subject: "Non-billable work", hours: 2, billable: false },
    ],
  },
  // Billable and non-billable projects, in two currencies, to see what each card keeps.
  TC204: {
    ...project(204, "INR Project", {
      custom_lifetime_value_to_date: 400000,
      custom_expected_lifetime_value: 900000,
      custom_lifetime_value_vs_billed_amount: 12000,
    }),
    ...project(
      204,
      "USD Project",
      {
        customer: USD_CUSTOMER,
        custom_lifetime_value_to_date: 40000,
        custom_expected_lifetime_value: 90000,
        custom_lifetime_value_vs_billed_amount: 1200,
      },
      "2",
    ),
    ...project(
      204,
      "Non-Billable Project",
      { custom_billing_type: "Non-Billable" },
      "3",
    ),
  },
  // 3 billable hours already go against the first contract, so its Hours left is 37 of 40.
  TC205: {
    ...project(205, "Fixed Cost Project"),
    ...billableTime(3),
  },
  TC206: {
    ...project(206, "Fixed Cost Project"),
    ...shareWith(process.env.EMP_EMAIL, process.env.EMP3_EMAIL),
  },
  TC207: {
    ...project(207, "Fixed Cost Project"),
  },
};
