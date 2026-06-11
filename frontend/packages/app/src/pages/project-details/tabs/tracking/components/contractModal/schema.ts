import { z } from "zod";

export const addContractSchema = z
  .object({
    startDate: z
      .string()
      .trim()
      .min(1, { message: "Please select a start date." }),
    endDate: z
      .string()
      .trim()
      .min(1, { message: "Please select an end date." }),
    hoursBought: z
      .string()
      .trim()
      .min(1, { message: "Please enter hours bought." })
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
        message: "Hours bought must be greater than 0.",
      }),
    salesOrder: z.string().trim(),
    salesInvoice: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date.",
      });
    }
  });
