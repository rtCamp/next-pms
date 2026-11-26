import type { WorkingFrequency } from "@/session";
import { formatCurrency } from "@/utils/format";
import { DEFAULT_HOURS_PER_WEEK, WEEKS_PER_MONTH } from "./constants";

/** An employee's working hours as the allocations endpoints return them. */
export interface EmployeeWorkingHours {
  custom_working_hours?: number | null;
  custom_work_schedule?: string | null;
}

function frequency(schedule: string | null | undefined): WorkingFrequency {
  return schedule === "Per Week" ? "Per Week" : "Per Day";
}

function weeklyHours(hours: number, schedule: string | null | undefined) {
  return frequency(schedule) === "Per Day" ? hours * 5 : hours;
}

/** The hours a day the employee works, two decimals; `undefined` when none are set. */
export function capacityHoursPerDay(
  employee: EmployeeWorkingHours,
): number | undefined {
  const hours = employee.custom_working_hours;
  if (!hours || hours <= 0) return undefined;
  const daily =
    frequency(employee.custom_work_schedule) === "Per Day" ? hours : hours / 5;
  return Number(daily.toFixed(2));
}

/** The employee's capacity as a week, e.g. `"40h/week"`; `""` when none is set. */
export function capacityLabel(employee: EmployeeWorkingHours): string {
  const hours = employee.custom_working_hours;
  if (!hours || hours <= 0) return "";
  return `${weeklyHours(hours, employee.custom_work_schedule)}h/week`;
}

/**
 * The hourly rate from the yearly CTC, e.g. `"₹625.00/hour"`: a month is four weeks of
 * the employee's hours (40 a week when unset). `""` without a CTC.
 */
export function hourlyRateLabel(
  employee: EmployeeWorkingHours & {
    ctc?: number | string | null;
    salary_currency?: string | null;
  },
): string {
  const ctc = Number(employee.ctc);
  if (!ctc) return "";
  const hours = employee.custom_working_hours;
  const hoursPerWeek =
    hours && hours > 0
      ? weeklyHours(hours, employee.custom_work_schedule)
      : DEFAULT_HOURS_PER_WEEK;
  const monthlyHours = hoursPerWeek * WEEKS_PER_MONTH;
  return `${formatCurrency(ctc / 12 / monthlyHours, employee.salary_currency)}/hour`;
}
