import { dayjs } from "frappe-ui";
import type { ProjectBillingTeam } from "@/pages/project-details/types";
import { DATE_FORMAT } from "./constants";
import type { ProjectFlatRate, ProjectRate } from "./types";

export interface RateRow {
  /** The child row's name, unique where the employee isn't. */
  id: string;
  employee: string;
  employeeName: string;
  image?: string;
  /** e.g. `"₹1,200.00/h"` */
  amount: string;
  hourlyRate: number;
  date: string;
}

export interface RateInput {
  employee: string;
  hourlyRate: number;
  validFrom: string;
}

export interface RateForm {
  employee: string;
  hourlyRate: string;
  validFrom: string;
}

export type RateErrors = Partial<Record<keyof RateForm, string>>;

type Money = (value: number) => string;

/** Member rates, newest valid-from first. */
export function toRateRows(rates: ProjectRate[], money: Money): RateRow[] {
  return rates
    .map((rate) => ({
      id: rate.name ?? "",
      employee: rate.employee ?? "",
      employeeName: rate.employee_name ?? rate.employee ?? "",
      image: rate.image ?? undefined,
      amount: `${money(rate.hourly_billing_rate ?? 0)}/h`,
      hourlyRate: rate.hourly_billing_rate ?? 0,
      date: rate.valid_from ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function toFlatRate(flat: ProjectFlatRate, money: Money) {
  return {
    amount: `${money(flat.flat_rate_hourly ?? 0)}/h`,
    date: flat.flat_rate_valid_from ?? "",
  };
}

export function formatRateDate(date: string): string {
  return date ? dayjs(date).format(DATE_FORMAT) : "";
}

/** An employee, a rate above 0 and a valid-from date. */
export function validateRate(form: RateForm): RateErrors {
  const errors: RateErrors = {};
  if (!form.employee.trim()) errors.employee = "Please select an employee";
  const rate = form.hourlyRate.trim();
  if (!rate) errors.hourlyRate = "Please enter an hourly rate.";
  else if (!(Number.isFinite(Number(rate)) && Number(rate) > 0)) {
    errors.hourlyRate = "Hourly rate must be greater than 0.";
  }
  if (!form.validFrom.trim()) {
    errors.validFrom = "Please select a valid-from date.";
  }
  return errors;
}

/** The child table with a rate added. */
export function withRate(current: ProjectBillingTeam[], input: RateInput) {
  return [
    ...current,
    {
      employee: input.employee,
      hourly_billing_rate: input.hourlyRate,
      valid_from: input.validFrom,
    },
  ];
}

/** The child table with the rate `name` replaced. */
export function withEditedRate(
  current: ProjectBillingTeam[],
  name: string,
  input: RateInput,
) {
  return current.map((row) =>
    row.name === name
      ? {
          ...row,
          employee: input.employee,
          hourly_billing_rate: input.hourlyRate,
          valid_from: input.validFrom,
        }
      : row,
  );
}
