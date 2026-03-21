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
  duration: z.number({
    required_error: "Select Duration",
  }),
  comment: z
    .string({
      required_error: "Please enter a comment.",
    })
    .trim()
    .min(1, { message: "Please enter a comment." }),
});

export type InlineTimeEntryValues = z.infer<typeof inlineTimeEntryValues>;
