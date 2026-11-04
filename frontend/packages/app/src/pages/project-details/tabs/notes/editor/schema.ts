import { z } from "zod";
import { TEMPLATE_DESCRIPTION_MAX_LENGTH } from "../constants";
import { NOTE_STATUS } from "../types";

export const noteFormSchema = z.object({
  project: z
    .string({ error: "Project Id is required" })
    .trim()
    .min(1, { message: "Project Id is required" }),
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, { message: "Title is required" }),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(1, { message: "Description is required" }),
  status: z.enum(NOTE_STATUS, { error: "Status is required" }),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

export const noteTemplateFormSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, { message: "Title is required" }),
  category: z.string().trim().nullable(),
  template_description: z
    .string()
    .trim()
    .max(TEMPLATE_DESCRIPTION_MAX_LENGTH, {
      message: `Description cannot exceed ${TEMPLATE_DESCRIPTION_MAX_LENGTH} characters`,
    }),
});

export type NoteTemplateFormValues = z.infer<typeof noteTemplateFormSchema>;
