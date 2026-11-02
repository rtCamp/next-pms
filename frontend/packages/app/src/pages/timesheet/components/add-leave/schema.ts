import { z } from "zod";
import { LEAVE_DURATION } from "./types";

export const addLeaveFormSchema = z
  .object({
    fromDate: z
      .string({
        error: "Please select from date.",
      })
      .trim()
      .min(1, { message: "Please select from date." }),
    toDate: z
      .string({
        error: "Please select to date.",
      })
      .trim()
      .min(1, { message: "Please select to date." }),
    leaveDuration: z.enum(LEAVE_DURATION, {
      error: "Please select leave duration.",
    }),
    halfDayDate: z.string().trim(),
    leaveType: z
      .string({
        error: "Please select leave type.",
      })
      .trim()
      .min(1, { message: "Please select leave type." }),
    reason: z
      .string({
        error: "Please enter a reason.",
      })
      .trim()
      .min(1, { message: "Please enter a reason." }),
  })
  .superRefine((value, ctx) => {
    if (value.leaveDuration === "full-day" || value.fromDate === value.toDate) {
      return;
    }

    if (!value.halfDayDate) {
      ctx.addIssue({
        code: "custom",
        path: ["halfDayDate"],
        message: "Please select half day date.",
      });
      return;
    }

    if (
      value.halfDayDate < value.fromDate ||
      value.halfDayDate > value.toDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["halfDayDate"],
        message: "Half day date must be between from date and to date.",
      });
    }
  });

export type AddLeaveFormValues = z.infer<typeof addLeaveFormSchema>;
