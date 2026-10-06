import { stripTags } from "@next-pms/design-system/utils";
import { z } from "zod";

export const addUpdateSchema = z.object({
  status: z.string().nullable(),
  risk_level: z.string().nullable(),
  note: z
    .string({
      required_error: "Note is required.",
    })
    .refine((value) => stripTags(value).trim().length > 0, {
      message: "Note is required.",
    }),
});

export type AddUpdateValues = z.infer<typeof addUpdateSchema>;
