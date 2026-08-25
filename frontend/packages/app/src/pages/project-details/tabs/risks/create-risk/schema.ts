import { z } from "zod";

const riskFormFields = {
  risk_category: z.string().nullable(),
  risk_owner: z.string(),
  summary: z.string(),
  mitigation_plan: z.string(),
};

export const createRiskSchema = z.object({
  ...riskFormFields,
  risk_level: z
    .string()
    .trim()
    .min(1, { message: "Please select a risk level." }),
  status: z.string().trim().min(1, { message: "Please select a status." }),
});

export const editRiskSchema = z.object({
  ...riskFormFields,
  risk_level: z.string(),
  status: z.string(),
});

export type CreateRiskValues = z.infer<typeof createRiskSchema>;
