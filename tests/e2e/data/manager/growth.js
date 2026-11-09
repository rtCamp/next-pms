// One seeded project per test case, so every Growth test starts from an empty tab.
const project = (n) => ({
  payloadCreateProject: {
    project_name: `TC${n} Project`,
    company: "rtCamp Solutions Pvt. Ltd.",
    customer: "Acme Corporation",
    billing_type: "Fixed Cost",
    currency: "INR",
    project_type: "Fixed Cost",
    business_unit: "Jupiter",
    estimated_cost: 20000,
    custom_default_hourly_billing_rate: 300,
    custom_project_budget_hours: [],
  },
  payloadDeleteProject: {
    projectId: "filled-automatically-from-createProjects",
  },
});

module.exports = {
  TC119: { ...project(119), activity: "TC119 Growth Initiative" },
  TC120: { ...project(120), activity: "TC120 Growth Initiative" },
  TC121: {
    ...project(121),
    activity: "TC121 Growth Initiative",
    description: "Upsell the support plan",
  },
  TC122: { ...project(122), activity: "TC122 Growth Initiative" },
  TC123: {
    ...project(123),
    activity: "TC123 Growth Initiative",
    note: "TC123 - closed via automation.",
  },
  TC124: {
    ...project(124),
    activityIdeation: "TC124 Ideation Initiative",
    activityInProgress: "TC124 In Progress Initiative",
  },
  TC125: {
    ...project(125),
    activity: "TC125 Growth Initiative",
    renamed: "TC125 Growth Initiative Renamed",
  },
  TC126: { ...project(126), activity: "TC126 Growth Initiative" },
  TC127: { ...project(127), activity: "TC127 Growth Initiative" },
  TC128: { ...project(128), activity: "TC128 Growth Initiative" },
  TC129: {
    ...project(129),
    activity: "TC129 Growth Initiative",
    note: "TC129 - progress note via automation.",
  },
  TC130: {
    ...project(130),
    activity: "TC130 Growth Initiative",
    note: "TC130 - priority raised via automation.",
  },
  TC131: { ...project(131), activity: "TC131 Growth Initiative" },
  TC132: { ...project(132), activity: "TC132 Growth Initiative" },
};
