import { z } from "zod";

export const expectedTimeSchema = z.preprocess(
  (val, ctx) => {
    if (typeof val === "string" && !val.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected_time"],
        message: "Please enter a valid time in Hours",
      });
      return null;
    }
    const processedValue = Number(val);
    if (isNaN(processedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected_time"],
        message: "Invalid Time format. Please enter a valid time in Hours",
      });
      return null;
    }
    return processedValue;
  },
  z.union([
    z.string({
      invalid_type_error: "Please enter a valid number for hours.",
    }),
    z.number({
      invalid_type_error: "Please enter a valid number for hours.",
    }),
  ]),
);
export const TaskSchema = z.object({
  subject: z
    .string({
      required_error: "Please add a subject.",
    })
    .trim()
    .min(1, { message: "Please add a subject." }),
  project: z
    .string({
      required_error: "Please select a project.",
    })
    .trim()
    .min(1, { message: "Please select a project." }),
  expected_time: expectedTimeSchema,
  description: z
    .string({
      required_error: "Please enter description.",
    })
    .trim()
    .min(4, "Please enter valid description."),
});
