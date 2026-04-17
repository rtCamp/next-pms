import { z } from "zod";

const selectionRangeSchema = z.object({
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
});

export const editScheduleFormSchema = z.object({
  selectedDayIds: z.array(z.string()),
  selectionAnchorIndex: z.number().int().min(0).nullable(),
  selectionRange: selectionRangeSchema.nullable(),
  perDayHours: z.record(z.string(), z.number().min(0)),
  applyEditsTo: z.enum([
    "this-allocation",
    "this-and-future",
    "all-occurrences",
  ]),
  hoursPerDay: z
    .number({
      required_error: "Please enter hours per day.",
    })
    .min(0, { message: "Hours per day cannot be negative." }),
});

export type EditScheduleFormValues = z.infer<typeof editScheduleFormSchema>;
