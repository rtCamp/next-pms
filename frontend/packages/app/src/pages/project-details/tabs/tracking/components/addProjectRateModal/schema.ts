import { z } from "zod";

export const addProjectRateSchema = z.object({
  isFlatRate: z.boolean(),
  employee: z.string().trim().min(1, { message: "Plese select an employee" }),
  hourlyRate: z
    .string()
    .trim()
    .min(1, { message: "Please enter an hourly rate." })
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
      message: "Hourly rate must be greater than 0.",
    }),
  validFrom: z
    .string()
    .trim()
    .min(1, { message: "Please select a valid-from date." }),
});
