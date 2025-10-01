/**
 * External dependencies.
 */
import { floatToTime } from "@next-pms/design-system";
import { getUTCDateTime, normalizeDate } from "@next-pms/design-system/date";
import { toast } from "@next-pms/design-system/hooks";
import { type ClassValue, clsx } from "clsx";
import { isToday } from "date-fns";
import { Error as FrappeError } from "frappe-js-sdk/lib/frappe_app/types";
import { twMerge } from "tailwind-merge";
import { envs } from "./envs";
/**
 * Internal dependencies.
 */
import { timeStringToFloat } from "@/schema/timesheet";
import { WorkingFrequency } from "@/types";
import { HolidayProp, LeaveProps } from "@/types/timesheet";

export const NO_VALUE_FIELDS = [
	"Section Break",
	"Column Break",
	"Tab Break",
	"HTML",
	"Table",
	"Table MultiSelect",
	"Button",
	"Image",
	"Fold",
	"Heading",
];

export function mergeClassNames(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getCookie(name: string) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(";").shift();
	return null;
}

export function setCookie(name: string, value: string, days: number) {
	const date = new Date();
	date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

export const getSiteName = () => {
	// eslint-disable-next-line
	// @ts-expect-error
	return window.frappe?.boot?.sitename ?? envs.SITE.NAME;
};

export function parseFrappeErrorMsg(error: FrappeError) {
	const messages = getErrorMessages(error);
	let message = "";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	messages.forEach((m: any) => {
		message += `${m.message}\n`;
	});
	if (message) {
		return removeHtmlString(message);
	} else {
		return "Something went wrong. Please try again later.";
	}
}

export function removeHtmlString(data: string) {
	return data.replace(/<\/?[^>]+(>|$)/g, "");
}

export function calculateExtendedWorkingHour(
	hours: number,
	expected_hours: number,
	frequency: WorkingFrequency,
) {
	const flotTime = floatToTime(hours);
	const timeToFloat = timeStringToFloat(flotTime);
	if (frequency === "Per Day") {
		if (timeToFloat > expected_hours) {
			return 2;
		} else if (timeToFloat < expected_hours) {
			return 0;
		} else {
			return 1;
		}
	}
	const perDay = expected_hours / 5;
	if (timeToFloat > perDay) {
		return 2;
	} else if (timeToFloat < perDay) {
		return 0;
	} else {
		return 1;
	}
}

export function calculateWeeklyHour(
	expected_hours: number,
	frequency: WorkingFrequency,
) {
	if (frequency === "Per Day") {
		return expected_hours * 5;
	} else {
		return expected_hours;
	}
}

export const expectatedHours = (
	expected_hours: number,
	frequency: WorkingFrequency,
): number => {
	if (frequency === "Per Day") {
		return expected_hours;
	}
	return expected_hours / 5;
};

export const isLiked = (likedBy: string, user: string) => {
	if (likedBy) {
		likedBy = JSON.parse(likedBy);
		if (likedBy && likedBy.includes(user)) {
			return true;
		}
	}
	return false;
};

export const getHolidayList = (holidays: Array<HolidayProp>) => {
	return holidays.map((holiday) => {
		return holiday.holiday_date;
	});
};

export const getErrorMessages = (error: FrappeError) => {
	let eMessages = error?._server_messages
		? JSON.parse(error?._server_messages)
		: [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	eMessages = eMessages.map((m: any) => {
		try {
			return JSON.parse(m);
		} catch (e) {
			return e;
		}
	});

	if (eMessages.length === 0) {
		// Get the message from the exception by removing the exc_type
		const index = error?.exception?.indexOf(":");
		if (index) {
			const exception = error?.exception?.slice(index + 1);
			if (exception) {
				eMessages = [
					{
						message: exception,
						title: "Error",
					},
				];
			}
		}

		if (eMessages.length === 0) {
			eMessages = [
				{
					message: error?.message,
					title: "Error",
				},
			];
		}
	}
	return eMessages;
};

export const checkIsMobile = () => {
	const width = window.innerWidth;
	if (width < 769) {
		return true;
	} else {
		return false;
	}
};

export const copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text);
	toast({ title: "Copied to clipboard", variant: "success" });
};

export const canExport = (doctype: string) => {
	// @ts-expect-error - frappe is global object provided by frappe
	return window.frappe?.boot?.user?.can_export?.includes(doctype) ?? true;
};
export const canCreate = (doctype: string) => {
	// @ts-expect-error - frappe is global object provided by frappe
	return window.frappe?.boot?.user?.can_create?.includes(doctype) ?? true;
};

export const currencyFormat = (currency: string = "INR"): Intl.NumberFormat => {
	// Currency-specific locale settings
	const localeSettings: Record<string, string> = {
		AED: "ar-AE", // UAE Dirham
		AUD: "en-AU", // Australian Dollar
		CHF: "de-CH", // Swiss Franc
		CNY: "zh-CN", // Chinese Yuan
		EUR: "de-DE", // Euro (German format)
		GBP: "en-GB", // British Pound
		INR: "en-IN", // Indian Rupee
		JPY: "ja-JP", // Japanese Yen
		USD: "en-US", // US Dollar
	};

	const locale = localeSettings[currency] || "en-IN";

	const options: Intl.NumberFormatOptions = {
		style: "currency",
		currency: currency || "INR",
		currencyDisplay: "symbol",
	};

	const zeroDecimalCurrencies = ["JPY", "KRW", "VND", "IDR"];
	if (zeroDecimalCurrencies.includes(currency)) {
		options.maximumFractionDigits = 0;
		options.minimumFractionDigits = 0;
	} else {
		// Default to 2 decimal places
		options.minimumFractionDigits = 2;
		options.maximumFractionDigits = 2;
	}

	try {
		return new Intl.NumberFormat(locale, options);
	} catch (e) {
		console.error(`Error formatting currency (${currency}):`, e);
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: currency || "INR",
		});
	}
};

export const getBgCsssForToday = (date: string) => {
	return isToday(getUTCDateTime(date)) ? "bg-slate-100 dark:bg-muted/50 " : "";
};

export const isDateInRange = (
	date: string,
	startDate: string,
	endDate: string,
) => {
	const targetDate = getUTCDateTime(normalizeDate(date));

	return (
		getUTCDateTime(startDate) <= targetDate &&
		targetDate <= getUTCDateTime(endDate)
	);
};

export const getTimesheetHours = (
	dates: Array<string>,
	timesheetTotalHour: number,
	leaves: Array<LeaveProps>,
	holidays: Array<HolidayProp>,
	dailyWorkingHours: number,
) => {
	let totalHours = timesheetTotalHour;
	let timeOffHours = 0;

	dates.map((date) => {
		const holiday = holidays.find((holiday) => holiday.holiday_date === date);
		if (holiday) {
			if (!holiday.weekly_off) {
				totalHours += dailyWorkingHours;
			}
		}
		const leaveData = leaves.filter((data) => {
			return date >= data.from_date && date <= data.to_date;
		});
		if (leaveData.length > 0) {
			for (const data of leaveData) {
				const isHalfDayLeave = data.half_day && data.half_day_date == date;
				if (isHalfDayLeave) {
					totalHours += dailyWorkingHours / 2;
					timeOffHours += dailyWorkingHours / 2;
				} else if (holiday?.weekly_off && !data.is_lwp) {
					continue;
				} else {
					totalHours += dailyWorkingHours;
					timeOffHours += dailyWorkingHours;
				}
			}
		}
	});
	return { totalHours, timeOffHours };
};

export const getCurrencySymbol = (currencyCode: string): string | null => {
	if (!currencyCode) {
		return "";
	}
	try {
		return (
			new Intl.NumberFormat("en", {
				style: "currency",
				currency: currencyCode,
			})
				.formatToParts(0)
				.find((part) => part.type === "currency")?.value || null
		);
	} catch (error) {
		console.error("Currency error:", error); // Explicit error logging
		return null;
	}
};

export const evaluateDependsOn = (
	dependsOn: string,
	doc: Record<string, string | number | null>,
): boolean => {
	if (!dependsOn) return true; // No condition means always true

	try {
		if (dependsOn.startsWith("eval:")) {
			const condition = dependsOn.slice(5).replace(/\\"/g, '"'); // Remove "eval:" prefix
			return new Function(
				"doc",
				`try { return Boolean(${condition}); } catch (e) { return false; }`,
			)(doc);
		} else if (dependsOn in doc) {
			return Boolean(doc[dependsOn]); // If it's just a fieldname, check if it's truthy
		} else {
			return true;
		}
	} catch (error) {
		console.error("Error evaluating depends_on:", error); // explicit error console
		return false;
	}
};

export const mapFieldsToObject = (
	fields: Array<Record<string, string | number | null>>,
) => {
	return fields.reduce(
		(acc, field) => {
			acc[field.fieldname!] = field.value;
			return acc;
		},
		{} as Record<string, string | number | null>,
	);
};

export const extractTextFromHTML = (htmlContent: string) => {
	const tempElement = document.createElement("div");
	tempElement.innerHTML = htmlContent;
	return tempElement?.textContent?.trim();
};

export const enableSocket = () => {
	const enableSocket = envs.SOCKET.ENABLE;
	if (typeof enableSocket !== "string") {
		return enableSocket;
	}
	if (enableSocket === "true") {
		return true;
	} else if (enableSocket === "false") {
		return false;
	} else {
		return true;
	}
};

export const formatTime = (timeStr: string): string => {
	if (timeStr.startsWith(":")) {
		timeStr = "0" + timeStr;
	}

	const parts = timeStr.split(":");
	if (parts.length !== 2) {
		throw new Error(`Invalid time format: ${timeStr}`);
	}

	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);

	if (isNaN(hours) || isNaN(minutes)) {
		throw new Error(`Invalid numeric values in time: ${timeStr}`);
	}

	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}`;
};

/**
 * Creates Default View.
 *
 * @param label Label string of the default view.
 * @param user user email string.
 * @param route Specify route for the view.
 * @param filters Filters object for the view (optional).
 * @param additionalProps Additional properties to include in the view (optional).
 * @returns Default View object
 */
export const getDefaultView = (
	label: string,
	user: string,
	route: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	filters: any = {},
) => {
	return {
		label,
		user,
		type: "Custom",
		route,
		filters,
		public: false,
		default: true,
	};
};
