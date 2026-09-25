/**
 * External dependencies.
 */
import { z } from "zod";

export const rejectLeaveSchema = z.object({
  reason: z
    .string({ required_error: "Rejection reason is required." })
    .trim()
    .min(1, { message: "Rejection reason is required." }),
});

export type RejectLeaveValues = z.infer<typeof rejectLeaveSchema>;
