import { z } from "zod";

export const editScheduleFormSchema = z
  .object({
    schedule: z.object({
      selection: z.object({
        startDate: z.string().trim(),
        endDate: z.string().trim(),
      }),
      input: z.object({
        value: z
          .number({
            required_error: "Please enter hours.",
          })
          .min(0, { message: "Must be greater than or equal to 0." }),
        mode: z.enum(["hoursPerDay", "totalHours"]),
      }),
    }),
  })
  .superRefine((value, ctx) => {
    const { startDate, endDate } = value.schedule.selection;

    if (!startDate || !endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "selection", "startDate"],
        message: "Please select a date.",
      });
      return;
    }

    if (startDate > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "selection", "endDate"],
        message: "End date must be on or after start date.",
      });
    }
  });

export type EditScheduleFormValues = z.infer<typeof editScheduleFormSchema>;
