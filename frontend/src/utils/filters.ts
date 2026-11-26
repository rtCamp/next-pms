import type { FilterCondition } from "@/components/Filter";

const NO_VALUE_OPERATORS = ["is_empty", "is_not_empty"];

export function isNoValueOperator(operator: string): boolean {
  return NO_VALUE_OPERATORS.includes(operator);
}

/**
 * Whether a condition can be sent to the server: it has a field and an operator, and a
 * value unless the operator takes none.
 */
export function isCompleteFilterCondition(condition: FilterCondition): boolean {
  if (!condition.field || !condition.operator) return false;
  if (isNoValueOperator(condition.operator)) return true;
  const { value } = condition;
  return (
    value !== null &&
    value !== undefined &&
    !(typeof value === "string" && value.trim() === "") &&
    !(Array.isArray(value) && value.length === 0)
  );
}

/** Wraps a `like` / `not like` value in `%` wildcards unless it already has one. */
export function normalizeLikeFilterValue(
  operator: string,
  value: FilterCondition["value"],
): FilterCondition["value"] {
  const normalized = operator.toLowerCase().trim();
  if (!["like", "not like"].includes(normalized) || typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("%") || trimmed.endsWith("%")) {
    return trimmed;
  }
  return `%${trimmed}%`;
}

/**
 * Turns the Filter component's conditions on a single doctype into Frappe filters, e.g.
 * `[["priority", "=", "Urgent"]]`. Incomplete conditions are left out.
 */
export function buildFilterConditions(conditions: FilterCondition[]) {
  return conditions
    .filter(isCompleteFilterCondition)
    .map((condition) => [
      condition.field,
      condition.operator,
      isNoValueOperator(condition.operator)
        ? null
        : normalizeLikeFilterValue(condition.operator, condition.value),
    ]);
}
