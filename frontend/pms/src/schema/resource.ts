import { z } from "zod";
import { hourSchema } from "./timesheet";

export const ResourceAllocationSchema = z.object({
  customer: z.string(),
  // .string({
  //   required_error: "Please select a customer.",
  // })
  // .trim()
  // .min(1, { message: "Please select a customer." }),
  project: z.string(),
  // .string({
  //   required_error: "Please select a customer.",
  // })
  // .trim()
  // .min(1, { message: "Please select a customer." }),
  hours_allocated_per_day: hourSchema,
  total_allocated_hours: hourSchema,
  is_billable: z.boolean(),
  allocation_start_date: z.string({
    required_error: "Please enter date.",
  }),
  allocation_end_date: z.string({
    required_error: "Please enter date.",
  }),
  note: z.string(),
  employee: z.string(),
});
