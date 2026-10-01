import { z } from "zod";

export const buildGrowthSchema = (
  isClosedStatus: (status: string) => boolean,
) =>
  z
    .object({
      activity: z
        .string()
        .trim()
        .min(1, { message: "Please enter an activity." }),
      category: z.string().nullable(),
      description: z.string(),
      client_priority: z.string(),
      status: z.string().trim().min(1, { message: "Please select a status." }),
      closed_status: z.string(),
      desired_outcome: z.string(),
      ideation_date: z
        .string()
        .trim()
        .min(1, { message: "Please pick an ideation date." }),
      activity_owner: z.string(),
      ideation_owner: z.string(),
      billable_outcome: z
        .string()
        .trim()
        .refine((value) => value === "" || Number(value) >= 0, {
          message: "Billable outcome must be zero or greater.",
        }),
    })
    .superRefine((values, ctx) => {
      if (isClosedStatus(values.status) && !values.closed_status) {
        ctx.addIssue({
          code: "custom",
          path: ["closed_status"],
          message: "Please select a closed status.",
        });
      }
    });

export type GrowthFormValues = z.infer<ReturnType<typeof buildGrowthSchema>>;
