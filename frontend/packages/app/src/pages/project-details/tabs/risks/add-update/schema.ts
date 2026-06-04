import { z } from "zod";

export const addUpdateSchema = z.object({
  status: z.string().nullable(),
  risk_level: z.string().nullable(),
  note: z.string(),
});

export type AddUpdateValues = z.infer<typeof addUpdateSchema>;
