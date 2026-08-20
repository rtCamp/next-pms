/**
 * Internal dependencies.
 */
import {
  containerVariants,
  contentVariants,
  dayLabelVariants,
  dayNumberVariants,
  monthTagVariants,
} from "./constants";
import { mergeClassNames as cn } from "../../utils";

type DayChipProps = {
  dayLabel: string;
  dayNumber: number;
  monthLabel?: string;
  isMonthBoundary?: boolean;
  state: DateChipVisualState;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export type DateChipVisualState =
  | "default"
  | "active"
  | "selected"
  | "disabled"
  | "skeleton"
  | "hover"
  | "focus";

export function DayChip({
  dayLabel,
  dayNumber,
  monthLabel,
  isMonthBoundary = false,
  state,
  disabled = false,
  onClick,
  className,
}: DayChipProps) {
  const isSkeleton = state === "skeleton";
  const isDisabled = disabled || state === "disabled" || isSkeleton;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        containerVariants({ state, disabled: isDisabled }),
        className,
      )}
      aria-pressed={state === "active" || state === "selected"}
    >
      <div className={cn(contentVariants({ skeleton: isSkeleton }))}>
        <span className={cn(dayLabelVariants({ state }))}>{dayLabel}</span>
        <span className={cn(dayNumberVariants({ state }))}>{dayNumber}</span>
      </div>
      {isMonthBoundary && monthLabel ? (
        <span className={cn(monthTagVariants({ skeleton: isSkeleton }))}>
          {monthLabel}
        </span>
      ) : null}
    </button>
  );
}
