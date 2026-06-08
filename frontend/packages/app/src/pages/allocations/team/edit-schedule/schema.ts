import { z } from "zod";

export const editScheduleFormSchema = z
  .object({
    startDate: z
      .string({
        required_error: "Please select a date.",
      })
      .trim()
      .min(1, { message: "Please select a date." }),
    endDate: z
      .string({
        required_error: "Please select a date.",
      })
      .trim()
      .min(1, { message: "Please select a date." }),
    hoursPerDay: z
      .number({
        required_error: "Please enter hours per day.",
      })
      .positive({ message: "Must be greater than 0." }),
  })
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date.",
      });
    }
  });

export type EditScheduleFormValues = z.infer<typeof editScheduleFormSchema>;
