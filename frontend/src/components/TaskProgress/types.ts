export type TaskProgressSize = "sm" | "md";

export interface TaskProgressProps {
  /** Progress in percent; above 100 the excess shows as a red overflow segment. */
  value: number;
  /** Bar height: `sm` 8px, `md` 16px. */
  size?: TaskProgressSize;
}
