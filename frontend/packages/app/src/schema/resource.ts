import { z } from "zod";

export const ResourceAllocationSchema = z
  .object({
    customer: z
      .string()
      .trim()
      .min(1, { message: "Please select a customer." }),
    customer_name: z.string(),
    project: z.string(),
    project_name: z.string(),
    hours_allocated_per_day: z.string(),
    total_allocated_hours: z.string().optional(),
    is_billable: z.boolean(),
    repeat_till_week_count: z.number().optional(),
    allocation_start_date: z
      .string({
        required_error: "Please enter date.",
      })
      .trim()
      .min(1, { message: "Please select a start date." }),
    allocation_end_date: z
      .string({
        required_error: "Please enter date.",
      })
      .trim()
      .min(1, { message: "Please select a end date." }),
    note: z.string().optional(),
    employee: z
      .string()
      .trim()
      .min(1, { message: "Please select an employee." }),
  })
  .superRefine((v, ctx) => {
    if (Number(v.hours_allocated_per_day) == 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours_allocated_per_day"],
        message: "Hour / Day should be greater than 0",
      });
    }
    if (Number(v.hours_allocated_per_day) > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours_allocated_per_day"],
        message: "Hour / Day should be less than 24",
      });
    }
    if (v.allocation_start_date > v.allocation_end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocation_end_date"],
        message: "End date should be greater than or equal to start date",
      });
    }
  });
