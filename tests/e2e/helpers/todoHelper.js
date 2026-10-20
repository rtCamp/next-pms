import {
  createDocument,
  getDocList,
  getDocument,
  getDoctypeFields,
} from "../utils/api/apiClient";
import { getFormattedDate } from "../utils/dateUtils";

export const TODO = "ToDo";
export const TIMELINE_ITEM = "Project Timeline Item";
export const INITIATIVE = "PMS Growth Initiative";

export const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export { dayOfThisMonth } from "../utils/dateUtils";

/**
 * Two days of the current month for a milestone and a touchpoint. The milestone
 * is never in the past: an overdue one makes staging log a RAG trigger against
 * the project, and that log blocks deleting it.
 */
export const milestoneAndTouchpointDays = () => {
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const milestone = Math.min(Math.max(today.getDate(), 10), last);
  const touchpoint = milestone + 3 <= last ? milestone + 3 : milestone - 3;
  return { milestone, touchpoint };
};

/** How a ToDo row prints a date picked at 12:00 am, e.g. "15 Oct, 12:00 am". */
export const rowDate = (day) => {
  const today = new Date();
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(today.getFullYear(), today.getMonth(), day),
  );
  return `${day} ${month}, 12:00 am`;
};

// Staging customizes ToDo (a Title, Start and End field, and the Backlog and
// In Progress statuses); a freshly installed site has neither unless the CI
// seed adds the fields.
let todoMeta;
export const getTodoMeta = () => {
  todoMeta ??= getDoctypeFields(TODO).then((fields) => ({
    hasCustomFields: [
      "custom_title",
      "custom_from_time",
      "custom_to_time",
    ].every((name) => fields.some((field) => field.fieldname === name)),
    statuses: (
      fields.find((field) => field.fieldname === "status")?.options ?? ""
    ).split("\n"),
  }));
  return todoMeta;
};

/** The statuses this site accepts besides Open and Closed. */
export const extraStatuses = async () => {
  const { statuses } = await getTodoMeta();
  return ["Backlog", "In Progress", "Cancelled"].filter((status) =>
    statuses.includes(status),
  );
};

/**
 * Creates a ToDo on a project. The description always carries the title, as the
 * page object fills it, so the row is found by it whether or not the site has
 * the Title custom field. `fields` overrides any default.
 */
export const seedTodo = async (projectId, title, fields = {}) => {
  const { hasCustomFields } = await getTodoMeta();
  return createDocument(TODO, {
    description: title,
    status: "Open",
    priority: "Medium",
    allocated_to: process.env.REP_MAN_EMAIL,
    // As the app sets it: whoever hands a ToDo out keeps access to it, which a
    // ToDo allocated to someone else relies on.
    assigned_by: process.env.REP_MAN_EMAIL,
    reference_type: "Project",
    reference_name: projectId,
    ...(hasCustomFields && {
      custom_title: title,
      custom_from_time: `${getFormattedDate(daysFromNow(1))} 10:00:00`,
      custom_to_time: `${getFormattedDate(daysFromNow(2))} 10:00:00`,
    }),
    ...fields,
  });
};

// One at a time: two parallel inserts on one project returned a 500 once.
export const seedTodos = async (projectId, titles) => {
  const todos = [];
  for (const title of titles) todos.push(await seedTodo(projectId, title));
  return todos;
};

export const seedTimelineItem = (
  projectId,
  type,
  title,
  todos = [],
  plannedEnd = getFormattedDate(daysFromNow(14)),
) =>
  createDocument(TIMELINE_ITEM, {
    project: projectId,
    type,
    title,
    // The Calendar grid only draws items that have a start date.
    start_date: plannedEnd,
    planned_end_date: plannedEnd,
    item_owner: process.env.REP_MAN_EMAIL,
    linked_todos: todos.map(({ name }) => ({ todo: name })),
  });

export const seedInitiative = (projectId, activity, todos = []) =>
  createDocument(INITIATIVE, {
    project: projectId,
    status: "Ideation",
    ideation_date: getFormattedDate(new Date()),
    activity,
    linked_todos: todos.map(({ name }) => ({ todo: name })),
  });

export const findTodo = async (projectId, title) =>
  (
    await getDocList(
      TODO,
      [
        ["reference_type", "=", "Project"],
        ["reference_name", "=", projectId],
        ["description", "like", `%${title}%`],
      ],
      { fields: ["name", "status"] },
    )
  )[0];

export const todosOfProject = (projectId) =>
  getDocList(TODO, [
    ["reference_type", "=", "Project"],
    ["reference_name", "=", projectId],
  ]);

export const linkedTodoNames = async (doctype, name) =>
  ((await getDocument(doctype, name))?.linked_todos ?? []).map(
    ({ todo }) => todo,
  );

export const fullNameOf = async (email) =>
  (await getDocument("User", email)).full_name;
