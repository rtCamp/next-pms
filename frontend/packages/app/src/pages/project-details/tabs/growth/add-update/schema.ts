import { stripTags } from "@next-pms/design-system/utils";
import { z } from "zod";
import {
  billableOutcomeSchema,
  requireClosedStatus,
} from "../create-growth/schema";

export const buildAddUpdateSchema = (
  isClosedStatus: (status: string) => boolean,
) =>
  z
    .object({
      status: z.string(),
      closed_status: z.string(),
      client_priority: z.string(),
      billable_outcome: billableOutcomeSchema,
      note: z
        .string({
          required_error: "Note is required.",
        })
        .refine((value) => stripTags(value).trim().length > 0, {
          message: "Note is required.",
        }),
    })
    .superRefine(requireClosedStatus(isClosedStatus));

export type AddUpdateValues = z.infer<ReturnType<typeof buildAddUpdateSchema>>;
