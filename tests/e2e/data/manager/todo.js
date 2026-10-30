// One seeded project per test case; the milestones, initiatives and ToDos are created by the test.
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

// A second project, for the case that checks the tab shows only its own ToDos.
const otherProject = (n) => ({
  payloadCreateProject2: {
    ...project(n).payloadCreateProject,
    project_name: `TC${n} Other Project`,
  },
  payloadDeleteProject2: {
    projectId: "filled-automatically-from-createProjects",
  },
});

module.exports = {
  TC142: {
    ...project(142),
    milestone: "TC142 Milestone",
    touchpoint: "TC142 Touchpoint",
    initiative: "TC142 Growth Initiative",
    milestoneTodo: "TC142 ToDo for the milestone",
    touchpointTodo: "TC142 ToDo for the touchpoint",
    initiativeTodo: "TC142 ToDo for the initiative",
  },
  TC143: {
    ...project(143),
    todo: "TC143 ToDo",
  },
  TC144: {
    ...project(144),
    milestone: "TC144 Milestone",
    todo: "TC144 ToDo",
  },
  TC145: {
    ...project(145),
    milestone: "TC145 Milestone",
    touchpoint: "TC145 Touchpoint",
    milestoneTodo: "TC145 ToDo added to the milestone",
    touchpointTodo: "TC145 ToDo added to the touchpoint",
  },
  TC146: {
    ...project(146),
    milestone: "TC146 Milestone",
    touchpoint: "TC146 Touchpoint",
    milestoneTodos: ["TC146 Milestone ToDo 1", "TC146 Milestone ToDo 2"],
    touchpointTodos: ["TC146 Touchpoint ToDo 1", "TC146 Touchpoint ToDo 2"],
  },
  TC147: {
    ...project(147),
    milestone: "TC147 Milestone with linked ToDos",
    emptyMilestone: "TC147 Milestone without ToDos",
    touchpoint: "TC147 Touchpoint with a linked ToDo",
    todos: ["TC147 ToDo 1", "TC147 ToDo 2"],
    touchpointTodo: "TC147 Touchpoint ToDo",
  },
  TC148: {
    ...project(148),
    initiative: "TC148 Growth Initiative",
    todo: "TC148 Action item",
  },
  TC149: {
    ...project(149),
    todo: "TC149 ToDo",
  },
  TC150: {
    ...project(150),
    ...otherProject(150),
    todo: "TC150 ToDo of this project",
    otherTodo: "TC150 ToDo of the other project",
  },
  TC151: {
    ...project(151),
    todo: "TC151 ToDo",
  },
  TC152: {
    ...project(152),
    todo: "TC152 ToDo",
  },
  TC153: {
    ...project(153),
    todo: "TC153 ToDo",
    description: "TC153 description of the work",
  },
  TC154: {
    ...project(154),
    todo: "TC154 ToDo",
  },
  TC155: {
    ...project(155),
    todo: "TC155 ToDo",
  },
  TC156: {
    ...project(156),
    todo: "TC156 ToDo that fails to save",
    statusTodo: "TC156 ToDo whose status change fails",
  },
  TC157: {
    ...project(157),
    milestone: "TC157 Milestone",
    todo: "TC157 ToDo",
    description: "TC157 description of the work",
  },
  TC158: {
    ...project(158),
    todo: "TC158 ToDo",
    addedText: " and the edit",
  },
  TC159: {
    ...project(159),
    milestone: "TC159 Milestone",
    todo: "TC159 ToDo",
  },
  TC160: {
    ...project(160),
    firstMilestone: "TC160 First milestone",
    secondMilestone: "TC160 Second milestone",
    todo: "TC160 ToDo",
  },
  TC161: {
    ...project(161),
    todo: "TC161 ToDo",
  },
  TC162: {
    ...project(162),
    milestone: "TC162 Milestone",
    touchpoint: "TC162 Touchpoint",
    initiative: "TC162 Growth Initiative",
    milestoneTodo: "TC162 ToDo on the milestone",
    touchpointTodo: "TC162 ToDo on the touchpoint",
    initiativeTodo: "TC162 ToDo on the initiative",
  },
  TC163: {
    ...project(163),
    milestone: "TC163 Milestone",
    linkedTodo: "TC163 Linked ToDo",
    unlinkedTodo: "TC163 Unlinked ToDo",
  },
  TC164: {
    ...project(164),
    milestone: "TC164 Milestone",
    todo: "TC164 ToDo",
  },
  TC165: {
    ...project(165),
    milestone: "TC165 Milestone",
    todos: ["TC165 ToDo to delete", "TC165 ToDo to keep"],
  },
  TC166: {
    ...project(166),
    milestone: "TC166 Milestone",
    todo: "TC166 First ToDo",
    addedTodo: "TC166 ToDo added from the hover card",
  },
  TC167: {
    ...project(167),
    milestone: "TC167 Milestone with ToDos",
    touchpoint: "TC167 Touchpoint without ToDos",
    todos: ["TC167 ToDo 1", "TC167 ToDo 2"],
  },
};
