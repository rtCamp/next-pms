import { z } from "zod";
import { NOTE_STATUS } from "../types";

export const noteFormSchema = z.object({
  project: z
    .string({ required_error: "Project Id is required" })
    .trim()
    .min(1, { message: "Project Id is required" }),
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, { message: "Title is required" }),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(1, { message: "Description is required" }),
  status: z.enum(NOTE_STATUS, { required_error: "Status is required" }),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
