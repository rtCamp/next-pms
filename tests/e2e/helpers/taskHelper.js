import {
  createDocument,
  getDocList,
  getDocument,
} from "../utils/api/apiClient";

export const TASK = "Task";

/**
 * Creates a task on a project through the API. `fields` overrides any default,
 * and `role` decides who owns the task.
 */
export const seedTask = (projectId, subject, fields = {}, role = "admin") =>
  createDocument(
    TASK,
    {
      subject,
      project: projectId,
      description: `${subject} - created through automation`,
      ...fields,
    },
    role,
  );

// One at a time: the list shows the newest task first, so the order they are
// created in is the order they appear in.
export const seedTasks = async (projectId, subjects, fields = {}) => {
  const tasks = [];
  for (const subject of subjects) {
    tasks.push(await seedTask(projectId, subject, fields));
  }
  return tasks;
};

export const findTask = async (subject) =>
  (
    await getDocList(TASK, [["subject", "=", subject]], {
      fields: [
        "name",
        "subject",
        "project",
        "status",
        "priority",
        "expected_time",
        "exp_end_date",
        "description",
        "owner",
      ],
    })
  )[0];

/** The users who starred a task; Frappe keeps them as a JSON string. */
export const likedBy = async (name) =>
  JSON.parse((await getDocument(TASK, name))?._liked_by || "[]");

/** How the list prints a due date, e.g. "Oct 12, 2026". */
export const dueDateText = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(year, month - 1, day),
  );
  return `${monthName} ${day}, ${year}`;
};
