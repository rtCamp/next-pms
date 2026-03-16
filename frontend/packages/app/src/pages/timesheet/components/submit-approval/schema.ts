import { z } from "zod";

export const submitApprovalSchema = z.object({
  note: z.string(),
  sendTo: z
    .string({ required_error: "Please select an approver." })
    .trim()
    .min(1, { message: "Please select an approver." }),
});
