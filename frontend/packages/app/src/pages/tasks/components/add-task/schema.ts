import { z } from "zod";
import { TASK_PRIORITIES } from "../../constants";

const expectedTimeSchema = z
  .string()
  .trim()
  .refine((value) => value !== "" && Number.isFinite(Number(value)), {
    message: "Please enter a valid time in hours.",
  });

export const addTaskFormSchema = z.object({
  subject: z
    .string({ error: "Please add a subject." })
    .trim()
    .min(1, { message: "Please add a subject." }),
  project: z
    .string({ error: "Please select a project." })
    .trim()
    .min(1, { message: "Please select a project." }),
  projectLabel: z.string().optional().default(""),
  expected_time: expectedTimeSchema,
  priority: z
    .enum([...TASK_PRIORITIES, ""] as const)
    .optional()
    .default(""),
  exp_end_date: z.string().trim().optional().default(""),
  description: z
    .string({ error: "Please enter description." })
    .trim()
    .min(4, { message: "Please enter valid description." }),
});

export const editTaskFormSchema = z.object({
  ...addTaskFormSchema.shape,
  description: z.string().trim(),
});

export type AddTaskFormValues = z.input<typeof addTaskFormSchema>;
