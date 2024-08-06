import { z } from "zod";

export const TimesheetSchema = z.object({
    task: z.string({
        required_error: "Please select a task.",
    }).trim().min(1, { message: 'Please select a task.' }),
    name: z.string({}).optional(),
    hours: z.preprocess((val) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            if (isNaN(parsed)) {
                throw new Error("Please enter a valid number for hours.");
            }
            return parsed;
        }
        return val;
    }, z.number()
        .refine((val) => /^\d+(\.\d)?$/.test(val.toString()), {
            message: "Hour must be a number with at most one decimal place",
        })
        .refine((val) => val > 0, {
            message: "Hour must be greater than 0",
        })
    ),
    date: z.string({
        required_error: "Please enter date.",
    }),
    description: z.string({
        required_error: "Please enter description.",
    }).min(4, "Please enter description."),
    parent: z.string({}).optional(),
    is_update: z.boolean({}),
    employee: z.string({}),
});


export const TimesheetApprovalSchema = z.object({
    start_date: z.string({
        required_error: "Please select a start date.",
    }).min(1, { message: 'Please select a start date.' }),
    end_date: z.string({
        required_error: "Please select a end date.",
    }).min(1, { message: 'Please select a end date.' }),
    notes: z.string({
        required_error: "Please enter note.",
    }).optional(),
    employee: z.string({
        required_error: "Please select a employee.",
    }),
});
