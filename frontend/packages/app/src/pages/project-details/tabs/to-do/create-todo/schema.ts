import { z } from "zod";

export const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Backlog", label: "Backlog" },
  { value: "In Progress", label: "In Progress" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
] as const;

export type TodoStatus = (typeof STATUS_OPTIONS)[number]["value"];
export type TodoPriority = (typeof PRIORITY_OPTIONS)[number]["value"];

const statusValues = STATUS_OPTIONS.map((o) => o.value) as [
  TodoStatus,
  ...TodoStatus[],
];
const priorityValues = PRIORITY_OPTIONS.map((o) => o.value) as [
  TodoPriority,
  ...TodoPriority[],
];

export const buildCreateTodoSchema = (hasCustomFields: boolean) =>
  z
    .object({
      title: hasCustomFields
        ? z.string().trim().min(1, { message: "Title is required." })
        : z.string(),
      description: z.string(),
      status: z.enum(statusValues),
      assignee: z.string().trim().min(1, { message: "Assignee is required." }),
      startAt: hasCustomFields
        ? z.string().trim().min(1, { message: "Start is required." })
        : z.string(),
      endAt: hasCustomFields
        ? z.string().trim().min(1, { message: "End is required." })
        : z.string(),
      priority: z.enum(priorityValues),
    })
    .refine(
      (values) => {
        if (!values.startAt || !values.endAt) return true;
        return new Date(values.endAt) >= new Date(values.startAt);
      },
      { message: "End must be on or after start.", path: ["endAt"] },
    );

export type CreateTodoValues = z.infer<
  ReturnType<typeof buildCreateTodoSchema>
>;
