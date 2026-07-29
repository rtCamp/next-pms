import { z } from "zod";
import { allocationRecurrenceLabels } from "./constants";

export const addAllocationFormSchema = z
  .object({
    employeeId: z
      .string({
        required_error: "Please select an employee.",
      })
      .trim()
      .min(1, { message: "Please select an employee." }),
    projectId: z
      .string({
        required_error: "Please select a project.",
      })
      .trim()
      .min(1, { message: "Please select a project." }),
    customer: z
      .string({
        required_error: "This project doesn't have a customer set.",
      })
      .trim()
      .min(1, { message: "This project doesn't have a customer set." }),
    recurrence: z.enum(
      Object.keys(allocationRecurrenceLabels) as ["one-time", "recurring"],
    ),
    includeWeekends: z.boolean(),
    fromDate: z
      .string({
        required_error: "Please select a start and end date.",
      })
      .trim()
      .min(1, { message: "Please select a start and end date." }),
    toDate: z
      .string({
        required_error: "Please select an end date.",
      })
      .trim()
      .min(1, { message: "Please select an end date." }),
    hoursPerDay: z
      .number({
        required_error: "Please enter hours per day.",
      })
      .positive({ message: "Must be greater than 0." }),
    // z.number() rejects NaN outright, so union in z.nan() to allow it as
    // the "field cleared" sentinel while keeping the int/nonnegative constraint
    // for real values; superRefine below handles the NaN/<1 recurring check.
    repeatFor: z.union([z.number().int().nonnegative(), z.nan()]),
    isBillable: z.boolean(),
    isTentative: z.boolean(),
    note: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.fromDate > value.toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toDate"],
        message: "End date must be on or after start date.",
      });
    }

    if (
      value.recurrence === "recurring" &&
      (Number.isNaN(value.repeatFor) || value.repeatFor < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatFor"],
        message: "Must be at least 1.",
      });
    }
  });

export type AddAllocationFormValues = z.infer<typeof addAllocationFormSchema>;
