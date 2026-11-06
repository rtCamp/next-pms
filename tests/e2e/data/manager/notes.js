// One seeded project per test case. Projects have no real Account Manager or
// subscribers, so publishing a note cannot notify anyone outside the test.
const project = (n, extra = {}) => ({
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
    ...extra,
  },
  payloadDeleteProject: {
    projectId: "filled-automatically-from-createProjects",
  },
});

module.exports = {
  TC133: {
    ...project(133),
    title: "TC133 Note",
    body: "TC133 - note body written by automation.",
  },
  TC134: {
    ...project(134),
    title: "TC134 Note",
    body: "TC134 - original body.",
    newTitle: "TC134 Note Edited",
    newBody: "TC134 - edited body.",
  },
  TC135: {
    ...project(135),
    templateTitle: "TC135 Template",
    body: "TC135 - template body.",
    addedText: " Edited by automation.",
  },
  TC136: { ...project(136) },
  TC137: {
    ...project(137, { custom_account_manager_: process.env.EMP2_EMAIL }),
    title: "TC137 Note",
    body: "TC137 - note body.",
  },
  TC138: {
    ...project(138, { custom_account_manager_: process.env.EMP2_EMAIL }),
    title: "TC138 Note",
    body: "TC138 - note body.",
    newBody: "TC138 - edited body.",
    comment: "TC138 - a comment that must not notify again.",
  },
  TC139: { ...project(139) },
  TC140: {
    ...project(140),
    title: "TC140 Note",
    body: "TC140 - note body.",
    comment: "please review this note",
  },
  TC141: {
    ...project(141),
    templateName: "TC141 Template",
    templateTitle: "TC141 Note From Template",
    body: "TC141 - body that comes from the template.",
    addedText: " Added after choosing the template.",
  },
};
