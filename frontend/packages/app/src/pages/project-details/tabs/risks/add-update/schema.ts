import { z } from "zod";

export const addUpdateSchema = z.object({
  status: z.string().nullable(),
  risk_level: z.string().nullable(),
  note: z.string().trim().min(1, { message: "Note is required." }),
});

export type AddUpdateValues = z.infer<typeof addUpdateSchema>;
