import type { FilterField, FilterOperatorOption } from "./types";

export const DEFAULT_OPERATORS: Record<string, FilterOperatorOption[]> = {
  string: [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Like", value: "like" },
    { label: "Not Like", value: "not like" },
  ],
  number: [
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" },
    { label: "Less Than or Equal To", value: "<=" },
    { label: "Greater Than or Equal To", value: ">=" },
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
  ],
  select: [
    { label: "is", value: "is" },
    { label: "is not", value: "is_not" },
    { label: "is empty", value: "is_empty", hideValue: true },
    { label: "is not empty", value: "is_not_empty", hideValue: true },
  ],
  date: [
    { label: "is", value: "is" },
    { label: "is before", value: "less_than" },
    { label: "is after", value: "greater_than" },
    { label: "is empty", value: "is_empty", hideValue: true },
    { label: "is not empty", value: "is_not_empty", hideValue: true },
  ],
  daterange: [{ label: "Between", value: "between" }],
  link: [
    { label: "Equals", value: "=" },
    { label: "Not Equals", value: "!=" },
    { label: "Like", value: "like" },
    { label: "Not Like", value: "not like" },
    { label: "is", value: "is" },
  ],
  default: [
    { label: "is", value: "is" },
    { label: "is not", value: "is_not" },
  ],
};

export function operatorsFor(
  field: FilterField | null | undefined,
): FilterOperatorOption[] {
  if (field?.operators) return field.operators;
  return (
    DEFAULT_OPERATORS[field?.type ?? "string"] ?? DEFAULT_OPERATORS.default
  );
}
