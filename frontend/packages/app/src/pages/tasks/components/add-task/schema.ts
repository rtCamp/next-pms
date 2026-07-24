import { z } from "zod";

const expectedTimeSchema = z
  .string({
    required_error: "Please enter a valid number for hours.",
  })
  .trim()
  .min(1, { message: "Please enter a valid time in Hours" })
  .refine((value) => Number.isFinite(Number(value)), {
    message: "Invalid Time format. Please enter a valid time in Hours",
  });

export const addTaskFormSchema = z.object({
  subject: z
    .string({ required_error: "Please add a subject." })
    .trim()
    .min(1, { message: "Please add a subject." }),
  project: z
    .string({ required_error: "Please select a project." })
    .trim()
    .min(1, { message: "Please select a project." }),
  projectLabel: z.string().optional().default(""),
  expected_time: expectedTimeSchema,
  description: z
    .string({ required_error: "Please enter description." })
    .trim()
    .min(4, { message: "Please enter valid description." }),
});

export type addTaskFormValues = z.input<typeof addTaskFormSchema>;
