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
      note: z.string().trim().min(1, { message: "Note is required." }),
    })
    .superRefine(requireClosedStatus(isClosedStatus));

export type AddUpdateValues = z.infer<ReturnType<typeof buildAddUpdateSchema>>;
