import { z } from "zod";

export const createGrowthSchema = z.object({
  activity: z.string().trim().min(1, { message: "Please enter an activity." }),
  category: z.string().nullable(),
  description: z.string(),
  client_priority: z.string(),
  status: z.string().trim().min(1, { message: "Please select a status." }),
  desired_outcome: z.string(),
  ideation_date: z
    .string()
    .trim()
    .min(1, { message: "Please pick an ideation date." }),
  activity_owner: z.string(),
  ideation_owner: z.string(),
  billable_outcome: z
    .string()
    .trim()
    .refine((value) => value === "" || Number(value) >= 0, {
      message: "Billable outcome must be a positive number.",
    }),
});

export type CreateGrowthValues = z.infer<typeof createGrowthSchema>;
