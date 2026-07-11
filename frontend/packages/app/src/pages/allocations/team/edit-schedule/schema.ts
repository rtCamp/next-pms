import { z } from "zod";

export const editScheduleFormSchema = z
  .object({
    schedule: z.object({
      selection: z.array(z.string().trim()),
      input: z.object({
        value: z
          .number({
            required_error: "Please enter hours.",
          })
          .min(0, { message: "Must be greater than or equal to 0." }),
        mode: z.enum(["hoursPerDay", "totalHours"]),
      }),
    }),
  })
  .superRefine((value, ctx) => {
    const { selection } = value.schedule;

    if (!selection || selection.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schedule", "selection"],
        message: "Please select a date.",
      });
    }
  });

export type EditScheduleFormValues = z.infer<typeof editScheduleFormSchema>;
