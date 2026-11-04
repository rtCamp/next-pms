import { stripTags } from "@next-pms/design-system/utils";
import { z } from "zod";

export const addTimeFormSchema = z.object({
  employeeId: z
    .string({
      error: "Please select an employee.",
    })
    .trim()
    .min(1, { message: "Please select an employee." }),
  project: z
    .string({
      error: "Select Project",
    })
    .trim()
    .min(1, { message: "Select Project" }),
  projectLabel: z.string().optional().default(""),
  task: z
    .string({
      error: "Select Task",
    })
    .trim()
    .min(1, { message: "Select Task" }),
  taskLabel: z.string().optional().default(""),
  taskStatus: z.string().optional().default(""),
  date: z
    .string({
      error: "Select Date",
    })
    .trim()
    .min(1, { message: "Select Date" }),
  duration: z
    .number({
      error: "Select Duration",
    })
    .positive({ message: "Select Duration" }),
  comment: z
    .string({
      error: "Please enter a comment.",
    })
    .refine((value) => stripTags(value).trim().length > 0, {
      message: "Please enter a comment.",
    }),
});

export type addTimeFormValues = z.input<typeof addTimeFormSchema>;
