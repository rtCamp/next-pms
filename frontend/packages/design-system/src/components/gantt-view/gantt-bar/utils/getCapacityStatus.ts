/**
 * Internal dependencies.
 */
import { FULL_DAY_HOURS } from "../../constants";
import { formatHours } from "../../utils";

type CapacityStatusVariant = "full" | "under" | "over";
type CapacityStatusLabelVariant = "amber" | "violet";

interface CapacityStatus {
  variant: CapacityStatusVariant;
  label: string;
  trailingLabel?: string;
  trailingLabelVariant?: CapacityStatusLabelVariant;
}

/**
 * Determines the capacity status based on allocated hours and capacity hours per day.
 */
export function getCapacityStatus(
  hours: number,
  capacityHoursPerDay?: number,
): CapacityStatus {
  const resolvedCapacityHoursPerDay = capacityHoursPerDay ?? FULL_DAY_HOURS;
  const difference = hours - resolvedCapacityHoursPerDay;
  const normalizedDifference = Number(formatHours(difference));

  if (normalizedDifference === 0) {
    return {
      variant: "full",
      label: "Full",
    };
  }

  const label = `${formatHours(Math.abs(normalizedDifference))}h ${normalizedDifference > 0 ? "over" : "free"}`;

  return {
    variant: normalizedDifference > 0 ? "over" : "under",
    label,
    trailingLabel: label,
    trailingLabelVariant: normalizedDifference > 0 ? "violet" : "amber",
  };
}
