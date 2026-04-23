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
    recurrence: z
      .string({
        required_error: "Please select recurrence.",
      })
      .refine(
        (value) => Object.keys(allocationRecurrenceLabels).includes(value),
        {
          message: "Please select recurrence.",
        },
      ),
    includeWeekends: z.boolean(),
    fromDate: z
      .string({
        required_error: "Please select from date.",
      })
      .trim()
      .min(1, { message: "Please select from date." }),
    toDate: z
      .string({
        required_error: "Please select to date.",
      })
      .trim()
      .min(1, { message: "Please select to date." }),
    hoursPerDay: z.number({
      required_error: "Please enter hours per day.",
    }),
    repeatFor: z.number().int().nonnegative(),
    isBillable: z.boolean(),
    isTentative: z.boolean(),
    note: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.recurrence === "recurring" && value.repeatFor < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatFor"],
        message: "Repeat for must be at least 1.",
      });
    }
  });

export type AddAllocationFormValues = z.infer<typeof addAllocationFormSchema>;
