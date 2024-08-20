import { z } from "zod";

export const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const hourSchema = z
    .string()
    .refine((value) => {
        // Check if the value matches either the time format or the floating number format
        return timeFormatRegex.test(value) || !isNaN(parseFloat(value));
    }, {
        message: "Invalid hour format. Please enter time as HH:MM or a number.",
    })
    .transform((value) => {
        if (typeof value === "string" && timeFormatRegex.test(value)) {
            // Convert time format to floating number
            const [hours, minutes] = value.split(":").map(Number);
            return hours + minutes / 60;
        }
        else if (typeof value === "string") {
            return parseFloat(value);
        } else {
            return value;
        }
    })

export const TimesheetSchema = z.object({
    task: z.string({
        required_error: "Please select a task.",
    }).trim().min(1, { message: 'Please select a task.' }),
    name: z.string({}).optional(),
    description: z.string({
        required_error: "Please enter description.",
    }).min(4, "Please enter description."),
    hours: hourSchema,
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
    if (v.hours > 24) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hours"],
            message: "Hour should be less than 24",
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
