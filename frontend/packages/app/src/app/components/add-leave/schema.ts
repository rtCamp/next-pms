import { z } from "zod";

export const addLeaveFormSchema = z
	.object({
		fromDate: z
			.string({
				required_error: "Please select from date.",
			})
			.trim()
			.min(1, { message: "Please select from date." }),
		toDate: z
			.string({
				required_error: "Please select to date.",
			})
			.trim()
			.min(1, { message: "Please select to date." }),
		leaveDuration: z
			.string({
				required_error: "Please select leave type.",
			})
			.trim()
			.min(1, { message: "Please select leave type." }),
		leaveType: z
			.string({
				required_error: "Please select leave type.",
			})
			.trim()
			.min(1, { message: "Please select leave type." }),
		reason: z
			.string({
				required_error: "Please select leave type.",
			})
			.trim()
			.min(1, { message: "Please select leave type." }),
	})

export type AddLeaveFormValues = z.infer<typeof addLeaveFormSchema>;
