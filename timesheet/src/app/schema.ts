import { z } from "zod";

export const TimesheetSchema = z.object({
    task: z.string({
        required_error: "Please select a task.",
    }),
    name: z.string({}).optional(),
    hours: z
        .string()
        .refine(
            (value) => !isNaN(parseFloat(value)) && /^\d+(\.\d)?$/.test(value),
            {
                message: "Hours must be a number with at most one decimal place",
            }
        ),
    date: z.string({
        required_error: "Please enter date.",
    }),
    description: z.string({
        required_error: "Please enter description.",
    }),
    parent: z.string({}).optional(),
    is_update: z.boolean({}),
    employee: z.string({}),
});
