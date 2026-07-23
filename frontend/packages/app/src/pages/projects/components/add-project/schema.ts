import { z } from "zod";

export const addProjectFormSchema = z.object({
  projectName: z
    .string({ required_error: "Enter Project Name" })
    .trim()
    .min(1, { message: "Enter Project Name" }),
  phase: z
    .string({ required_error: "Select Phase" })
    .trim()
    .min(1, { message: "Select Phase" }),
  company: z
    .string({ required_error: "Select Company" })
    .trim()
    .min(1, { message: "Select Company" }),
});

export type AddProjectFormValues = z.infer<typeof addProjectFormSchema>;
