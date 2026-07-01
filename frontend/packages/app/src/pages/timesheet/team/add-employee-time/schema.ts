import { stripTags } from "@next-pms/design-system/utils";
import { z } from "zod";

export const addTimeFormSchema = z.object({
  employeeId: z
    .string({
      required_error: "Please select an employee.",
    })
    .trim()
    .min(1, { message: "Please select an employee." }),
  project: z
    .string({
      required_error: "Select Project",
    })
    .trim()
    .min(1, { message: "Select Project" }),
  task: z
    .string({
      required_error: "Select Task",
    })
    .trim()
    .min(1, { message: "Select Task" }),
  date: z
    .string({
      required_error: "Select Date",
    })
    .trim()
    .min(1, { message: "Select Date" }),
  duration: z
    .number({
      required_error: "Select Duration",
      invalid_type_error: "Select Duration",
    })
    .positive({ message: "Select Duration" }),
  comment: z
    .string({
      required_error: "Please enter a comment.",
    })
    .refine((value) => stripTags(value).trim().length > 0, {
      message: "Please enter a comment.",
    }),
});

export type addTimeFormValues = z.infer<typeof addTimeFormSchema>;
