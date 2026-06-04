import { z } from "zod";

export const createRiskSchema = z.object({
  risk_category: z.string().nullable(),
  risk_level: z
    .string()
    .trim()
    .min(1, { message: "Please select a risk level." }),
  status: z.string().trim().min(1, { message: "Please select a status." }),
  summary: z.string(),
  mitigation_plan: z.string(),
});

export type CreateRiskValues = z.infer<typeof createRiskSchema>;
