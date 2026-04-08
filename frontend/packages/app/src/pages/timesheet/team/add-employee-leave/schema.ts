import { z } from "zod";
import { LEAVE_DURATION } from "./types";

export const addLeaveFormSchema = z.object({
  employeeId: z
    .string({
      required_error: "Please select an employee.",
    })
    .trim()
    .min(1, { message: "Please select an employee." }),
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
  leaveDuration: z.enum(LEAVE_DURATION, {
    required_error: "Please select leave duration.",
  }),
  leaveType: z
    .string({
      required_error: "Please select leave type.",
    })
    .trim()
    .min(1, { message: "Please select leave type." }),
  reason: z
    .string({
      required_error: "Please enter a reason.",
    })
    .trim()
    .min(1, { message: "Please enter a reason." }),
});

export type AddLeaveFormValues = z.infer<typeof addLeaveFormSchema>;
