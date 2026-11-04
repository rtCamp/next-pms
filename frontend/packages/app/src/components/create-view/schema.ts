import { z } from "zod";

export const createViewFormSchema = z.object({
  name: z
    .string({ error: "Enter View Name" })
    .trim()
    .min(1, { message: "Enter View Name" }),
  isPublic: z.boolean(),
  icon: z.string(),
});

export type CreateViewFormValues = z.infer<typeof createViewFormSchema>;
