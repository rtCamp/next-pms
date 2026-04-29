import { mergeClassNames as cn } from "@next-pms/design-system";
import { cva } from "class-variance-authority";

type EditScheduleDayChipProps = {
  dayLabel: string;
  dayNumber: number;
  monthLabel?: string;
  isMonthBoundary?: boolean;
  state: DateChipVisualState;
  disabled?: boolean;
  onClick?: () => void;
};

export type DateChipVisualState =
  | "default"
  | "active"
  | "selected"
  | "disabled"
  | "skeleton"
  | "hover"
  | "focus";

const containerVariants = cva(
  "relative h-11.75 w-10.5 shrink-0 rounded-[12px] px-1.5 py-2 transition-colors",
  {
    variants: {
      state: {
        default: "bg-surface-gray-1",
        active: "bg-surface-gray-7",
        selected: "bg-surface-gray-3",
        disabled: "bg-surface-gray-1",
        skeleton: "bg-surface-gray-1 opacity-30",
        hover: "bg-surface-gray-2",
        focus: "bg-surface-gray-1 ring-2 ring-outline-gray-3",
      },
      disabled: {
        true: "cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
  },
);

const contentVariants = cva(
  "mx-auto flex w-5.25 flex-col items-center gap-0.5 text-center",
  {
    variants: {
      skeleton: {
        true: "opacity-0",
        false: "",
      },
    },
  },
);

const dayLabelVariants = cva(
  "text-[11px] font-normal leading-[1.15] tracking-[0.11px]",
  {
    variants: {
      state: {
        default: "text-ink-gray-4",
        active: "text-ink-gray-3",
        selected: "text-ink-gray-5",
        disabled: "text-ink-gray-3",
        skeleton: "text-ink-gray-3",
        hover: "text-ink-gray-4",
        focus: "text-ink-gray-4",
      },
    },
  },
);

const dayNumberVariants = cva(
  "text-sm font-medium leading-[1.15] tracking-[0.21px]",
  {
    variants: {
      state: {
        default: "text-ink-gray-6",
        active: "text-ink-white",
        selected: "text-ink-gray-7",
        disabled: "text-ink-gray-3",
        skeleton: "text-ink-gray-3",
        hover: "text-ink-gray-6",
        focus: "text-ink-gray-6",
      },
    },
  },
);

const monthTagVariants = cva(
  "pointer-events-none h-3 absolute left-1/2 -translate-x-1/2 -bottom-1.5 rounded-[5px] px-1 py-0.5 text-[9px] leading-none",
  {
    variants: {
      skeleton: {
        true: "bg-surface-gray-1 text-transparent",
        false: "bg-surface-white text-ink-gray-5",
      },
    },
  },
);

export function DayChip({
  dayLabel,
  dayNumber,
  monthLabel,
  isMonthBoundary = false,
  state,
  disabled = false,
  onClick,
}: EditScheduleDayChipProps) {
  const isSkeleton = state === "skeleton";
  const isDisabled = disabled || state === "disabled" || isSkeleton;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(containerVariants({ state, disabled: isDisabled }))}
      aria-pressed={state === "active" || state === "selected"}
    >
      <div className={cn(contentVariants({ skeleton: isSkeleton }))}>
        <span className={cn(dayLabelVariants({ state }))}>{dayLabel}</span>
        <span className={cn(dayNumberVariants({ state }))}>{dayNumber}</span>
      </div>

      {isMonthBoundary ? (
        <span className={cn(monthTagVariants({ skeleton: isSkeleton }))}>
          {monthLabel}
        </span>
      ) : null}
    </button>
  );
}
