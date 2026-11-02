import { z } from "zod";

export const addProjectFormSchema = z.object({
  projectName: z
    .string({ error: "Enter Project Name" })
    .trim()
    .min(1, { message: "Enter Project Name" }),
  phase: z
    .string({ error: "Select Phase" })
    .trim()
    .min(1, { message: "Select Phase" }),
  company: z
    .string({ error: "Select Company" })
    .trim()
    .min(1, { message: "Select Company" }),
  customer: z
    .string({ error: "Select Customer" })
    .trim()
    .min(1, { message: "Select Customer" }),
});

export type AddProjectFormValues = z.infer<typeof addProjectFormSchema>;
