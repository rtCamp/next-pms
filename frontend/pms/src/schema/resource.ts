import { z } from "zod";
import { hourSchema } from "./timesheet";

export const ResourceAllocationSchema = z
  .object({
    customer: z
      .string()
      .trim()
      .min(1, { message: "Please select a customer." }),
    customer_name: z.string(),
    // .string({
    //   required_error: "Please select a customer.",
    // })
    // .trim()
    // .min(1, { message: "Please select a customer." }),
    project: z.string(),
    project_name: z.string(),
    //.string({
    // .string({
    //   required_error: "Please select a customer.",
    // })
    // .trim()
    // .min(1, { message: "Please select a customer." }),
    hours_allocated_per_day: hourSchema,
    total_allocated_hours: hourSchema,
    is_billable: z.boolean(),
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
    note: z.string(),
    employee: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.hours_allocated_per_day == 0) {
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
  });
