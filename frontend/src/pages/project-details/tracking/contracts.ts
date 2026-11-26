import { dayjs } from "frappe-ui";
import type { ProjectBudget } from "@/pages/project-details/types";
import { formatNumber } from "@/utils/format";
import { DATE_FORMAT } from "./constants";
import type { TrackingContract } from "./types";

export interface ContractRow {
  id: string;
  /** The child row's name; empty for a row the server didn't name. */
  name: string;
  startDate: string;
  endDate: string;
  hoursBought: string;
  hoursBoughtRaw: number;
  hoursUsed: string;
  hoursLeft: string;
  salesOrder: string;
  salesInvoice: string;
}

export interface ContractInput {
  startDate: string;
  endDate: string;
  hoursBought: number;
  salesOrder?: string;
  salesInvoice?: string;
}

export interface ContractForm {
  startDate: string;
  endDate: string;
  hoursBought: string;
  salesOrder: string;
  salesInvoice: string;
}

export type ContractErrors = Partial<Record<keyof ContractForm, string>>;

export function toContractRows(contracts: TrackingContract[]): ContractRow[] {
  return contracts.map((contract, index) => ({
    id:
      contract.name ||
      contract.sales_order ||
      contract.sales_invoice ||
      `${index}`,
    name: contract.name,
    startDate: contract.start_date,
    endDate: contract.end_date,
    hoursBought: formatNumber(contract.hours_purchased),
    hoursBoughtRaw: contract.hours_purchased,
    hoursUsed: formatNumber(contract.consumed_hours),
    hoursLeft: formatNumber(contract.remaining_hours),
    salesOrder: contract.sales_order ?? "",
    salesInvoice: contract.sales_invoice ?? "",
  }));
}

export function formatContractDate(date: string): string {
  return date ? dayjs(date).format(DATE_FORMAT) : "";
}

/** Both dates required, hours above 0, the end on or after the start. */
export function validateContract(form: ContractForm): ContractErrors {
  const errors: ContractErrors = {};
  if (!form.startDate.trim()) errors.startDate = "Please select a start date.";
  if (!form.endDate.trim()) errors.endDate = "Please select an end date.";
  const hours = form.hoursBought.trim();
  if (!hours) errors.hoursBought = "Please enter hours bought.";
  else if (!(Number.isFinite(Number(hours)) && Number(hours) > 0)) {
    errors.hoursBought = "Hours bought must be greater than 0.";
  }
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    errors.endDate = "End date must be on or after start date.";
  }
  return errors;
}

function toBudget(input: ContractInput) {
  return {
    start_date: input.startDate,
    end_date: input.endDate,
    hours_purchased: input.hoursBought,
    sales_order: input.salesOrder ?? "",
    sales_invoice: input.salesInvoice ?? "",
  };
}

/** The child table with a contract added. */
export function withContract(current: ProjectBudget[], input: ContractInput) {
  return [...current, toBudget(input)];
}

/** The child table with the contract `name` replaced. */
export function withEditedContract(
  current: ProjectBudget[],
  name: string,
  input: ContractInput,
) {
  return current.map((row) =>
    row.name === name ? { ...row, ...toBudget(input) } : row,
  );
}

/** The child table without the row `name`. */
export function withoutRow<T extends { name?: string }>(
  current: T[],
  name: string,
): T[] {
  return current.filter((row) => row.name !== name);
}
