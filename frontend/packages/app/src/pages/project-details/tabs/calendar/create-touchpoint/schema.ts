import { z } from "zod";

export const createTouchpointSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Please enter a touchpoint name." }),
  scheduledDate: z
    .string()
    .trim()
    .min(1, { message: "Please select a scheduled date." }),
  owner: z.string().trim().min(1, { message: "Please select an owner." }),
});
