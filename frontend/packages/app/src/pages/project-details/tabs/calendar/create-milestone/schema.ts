import { z } from "zod";

export const createMilestoneSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { message: "Please enter a milestone name." }),
    startDate: z
      .string()
      .trim()
      .min(1, { message: "Please select a start date." }),
    completionDate: z
      .string()
      .trim()
      .min(1, { message: "Please select a completion date." }),
    owner: z.string().trim().min(1, { message: "Please select an owner." }),
  })
  .superRefine((value, ctx) => {
    if (
      value.startDate &&
      value.completionDate &&
      value.startDate > value.completionDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completionDate"],
        message: "Completion date must be on or after start date.",
      });
    }
  });
