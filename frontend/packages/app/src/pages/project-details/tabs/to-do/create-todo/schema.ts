import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required." }),
  description: z.string(),
});

export type CreateTodoValues = z.infer<typeof createTodoSchema>;
