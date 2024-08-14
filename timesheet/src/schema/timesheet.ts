import { z } from "zod";

export const TimesheetSchema = z.object({
    task: z.string({
        required_error: "Please select a task.",
    }).trim().min(1, { message: 'Please select a task.' }),
    name: z.string({}).optional(),
    description: z.string({
        required_error: "Please enter description.",
    }).min(4, "Please enter description."),
    hours: z.preprocess((val, ctx) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            if (isNaN(parsed)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["hours"],
                    message: "Please enter a valid number for hours.",
                });
                return null;
            }
            return parsed;
        }
        return val;
    }, z.number({
        invalid_type_error: "Please enter a valid number for hours.",
    })
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
            message: "Hour must be a number with at most two decimal place",
        })
    ),
    date: z.string({
        required_error: "Please enter date.",
    }),

    parent: z.string({}).optional(),
    is_update: z.boolean({}),
    employee: z.string({}),
}).superRefine((v, ctx) => {
    if (v.hours == 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hours"],
            message: "Hour should be greater than 0",
        });
    }
})


export const TimesheetApprovalSchema = z.object({
    start_date: z.string({
        required_error: "Please select a start date.",
    }).min(1, { message: 'Please select a start date.' }),
    end_date: z.string({
        required_error: "Please select a end date.",
    }).min(1, { message: 'Please select a end date.' }),
    notes: z.string({}).optional(),
    employee: z.string({
        required_error: "Please select a employee.",
    }),
});


export const TimesheetRejectionSchema = z.object({
    dates: z.array(z.string()).nonempty({
        message: "Please select a date.",
    }),
    note: z.string({
        required_error: "Please enter notes.",
    }).min(4, "Please enter notes."),
    employee: z.string({
        required_error: "Please select a employee.",
    }),
});
