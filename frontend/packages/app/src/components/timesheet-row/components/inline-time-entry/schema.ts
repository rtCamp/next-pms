import { stripTags } from "@next-pms/design-system/utils";
import { z } from "zod";

export const inlineTimeEntryValues = z.object({
  task: z
    .string({
      required_error: "Select Task",
    })
    .trim()
    .min(1, { message: "Select Task" }),
  date: z
    .string({
      required_error: "Select Date",
    })
    .trim()
    .min(1, { message: "Select Date" }),
  duration: z
    .number({
      required_error: "Select Duration",
      invalid_type_error: "Select Duration",
    })
    .positive({ message: "Select Duration" }),
  comment: z
    .string({
      required_error: "Please enter a comment.",
    })
    .refine((value) => stripTags(value).trim().length > 0, {
      message: "Please enter a comment.",
    }),
});

export type InlineTimeEntryValues = z.infer<typeof inlineTimeEntryValues>;
