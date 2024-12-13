import { z } from "zod";

export const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const descriptionSchema = z
  .string({
    required_error: "Please enter description.",
  })
  .trim()
  .min(1, { message: "Please enter description." });

export const hourSchema = z.preprocess(
  (val, ctx) => {
    const processedValue = timeStringToFloat(String(val));
    if (isNaN(processedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "Invalid hour format. Please enter time as HH:MM or a number.",
      });
      return null;
    }
    return processedValue;
  },
  z
    .union([
      z.string({
        invalid_type_error: "Please enter a valid number for hours.",
      }),
      z.number({
        invalid_type_error: "Please enter a valid number for hours.",
      }),
    ])
    .refine((val) => /^\d+(\.\d{1,3})?$/.test(val.toString()), {
      message: "Hours must be a number with at most two decimal places.",
    })
);

export const TimesheetSchema = z
  .object({
    task: z
      .string({
        required_error: "Please select a task.",
      })
      .trim()
      .min(1, { message: "Please select a task." }),
    description: descriptionSchema,
    hours: hourSchema,
    date: z.string({
      required_error: "Please enter date.",
    }),
    employee: z.string({}),
  })
  .superRefine((v, ctx) => {
    if (v.hours == 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "Hour should be greater than 0",
      });
    }
    if (Number(v.hours) > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "Hour should be less than 24",
      });
    }
  });

export const TimesheetApprovalSchema = z.object({
  start_date: z
    .string({
      required_error: "Please select a start date.",
    })
    .min(1, { message: "Please select a start date." }),
  end_date: z
    .string({
      required_error: "Please select a end date.",
    })
    .min(1, { message: "Please select a end date." }),
  notes: z.string({}).optional(),
  approver: z.string({
    required_error: "Please select a approver from the list.",
  }),
  employee: z.string({
    required_error: "Please select a employee.",
  }),
});

export const TimesheetRejectionSchema = z.object({
  dates: z.array(z.string()).nonempty({
    message: "Please select a date.",
  }),
  note: descriptionSchema,
  employee: z.string({
    required_error: "Please select a employee.",
  }),
});

export const TimesheetSingleRowSchema = z
  .object({
    name: z.string({}),
    hours: hourSchema,
    description: descriptionSchema,
    date: z.string({}),
    task: z.string({}),
    parent: z.string({}),
    is_billable: z
      .union([z.boolean(), z.number()])
      .transform((val) => {
        if (typeof val === "number") {
          return Boolean(val);
        }
        return val;
      })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.hours == 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "Hour should be greater than 0",
      });
    }
    if (Number(v.hours) > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "Hour should be less than 24",
      });
    }
  });
export const TimesheetUpdateSchema = z.object({
  data: z.array(TimesheetSingleRowSchema),
});

// Preprocessing time function to convert "HH:MM" format to float
export const timeStringToFloat = (value: string) => {
  // First,check if characters other than [0-9,:,.] are not present in string else throw error
  if (/[^0-9:.]/.test(value)) {
    return NaN;
  }

  // check if there are no two "." and ":" in the string
  const tooManyColons = (value.match(/:/g) || []).length > 1;
  const tooManyDots = (value.match(/\./g) || []).length > 1;
  // Return NaN if there are more than two colons or dots
  if (tooManyColons || tooManyDots) {
    return NaN;
  }

  //Check for invalid formats where both "." and ":" are present together
  if (value.includes(".") && value.includes(":")) {
    return NaN;
  }

  // Check for invalid formats like "1.5:MM", "HH:1.5", etc.
  if (/^\d+\.\d+:\d+$/.test(value) || /^\d+:\d+\.\d+$/.test(value)) {
    return NaN;
  }

  // Check if the input is in ":M" format (e.g., ":30" -> 0.5 hours)
  const matchMinutesOnly = /^:([0-5]\d)$/.exec(value);
  if (matchMinutesOnly) {
    const minutes = parseInt(matchMinutesOnly[1], 10);
    return parseFloat((minutes / 60).toFixed(3));
  }

  // Check if the input is in "HH:MM" or "H:M" format
  const matchFullTime = /^(\d{1,2}):([0-5]?\d)$/.exec(value);
  if (matchFullTime) {
    const hours = parseInt(matchFullTime[1], 10);
    const minutes = parseInt(matchFullTime[2], 10);
    return parseFloat((hours + minutes / 60).toFixed(3));
  }

  // Attempt to parse as a float for direct float input
  const parsed = parseFloat(value);
  return isNaN(parsed) ? NaN : parseFloat(parsed.toFixed(3));
};
