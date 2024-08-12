import { z } from "zod";

export const TimesheetSchema = z.object({
    task: z.string({
        required_error: "Please select a task.",
    }).trim().min(1, { message: 'Please select a task.' }),
    name: z.string({}).optional(),
    description: z.string({}).optional(),
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
    ),
    date: z.string({
        required_error: "Please enter date.",
    }),

    parent: z.string({}).optional(),
    is_update: z.boolean({}),
    employee: z.string({}),
}).superRefine((v, ctx) => {
    if (v.is_update == false && v.hours == 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hours"],
            message: "Hour should be greater than 0",
        });
    }
}).superRefine((v, ctx) => {
    if (v.is_update == false || (v.is_update == true && v.hours != 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["description"],
            message: "please provide description",
        })

        if (v.description && v.description?.length < 4) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["description"],
                message: "please provide description",
            })
        }
    }
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
