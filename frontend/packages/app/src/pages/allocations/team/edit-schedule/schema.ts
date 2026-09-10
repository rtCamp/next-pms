import { z } from "zod";

export const editScheduleFormSchema = z.object({
  schedule: z.object({
    selection: z
      .array(z.string().trim())
      .min(1, { message: "Please select a date." }),
    input: z.object({
      value: z
        .number({
          required_error: "Please enter hours.",
        })
        .min(0, { message: "Must be greater than or equal to 0." }),
      mode: z.enum(["hoursPerDay", "totalHours"]),
    }),
  }),
});

export type EditScheduleFormValues = z.infer<typeof editScheduleFormSchema>;
