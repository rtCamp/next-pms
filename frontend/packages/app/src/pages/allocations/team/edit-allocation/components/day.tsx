import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { cva } from "class-variance-authority";
import type { EditScheduleDayCellData } from "../types";

type EditScheduleDayProps = EditScheduleDayCellData & {
  className?: string;
  onClick?: (id: string) => void;
};

const dayCellVariants = cva(
  [
    "relative h-[47px] w-[42px] shrink-0 rounded-xl",
    "inline-flex flex-col items-center justify-center gap-0.5",
    "transition-colors duration-150",
  ],
  {
    variants: {
      interaction: {
        default: "bg-surface-gray-2 border border-transparent text-ink-gray-5",
        hover:
          "bg-surface-white border border-outline-gray-modals text-ink-gray-7",
        active: "bg-black border border-black text-white",
        focus:
          "bg-surface-white border border-outline-gray-modals text-ink-gray-7 ring-2 ring-surface-gray-4 ring-offset-1 ring-offset-surface-white",
        selected: "bg-black border border-black text-white",
        range:
          "bg-surface-gray-3 border border-outline-gray-modals text-ink-gray-7",
        disabled: "bg-surface-gray-2 border border-transparent text-ink-gray-4",
        skeleton: "bg-surface-gray-2 border border-transparent text-ink-gray-4",
      },
      disabled: {
        true: "cursor-not-allowed opacity-60",
        false: "",
      },
    },
  },
);

export function EditScheduleDay({
  id,
  dayName = "",
  dayNumber = "",
  monthLabel,
  isNewMonth,
  interaction,
  className,
  onClick,
}: EditScheduleDayProps) {
  const isSkeleton = interaction === "skeleton";
  const isDisabled = interaction === "disabled";

  return (
    <button
      type="button"
      className={cn(
        dayCellVariants({ interaction, disabled: isDisabled }),
        className,
      )}
      disabled={isDisabled}
      onClick={() => onClick?.(id)}
      aria-label={
        dayName && dayNumber
          ? `${dayName} ${dayNumber}${isNewMonth && monthLabel ? ` ${monthLabel}` : ""}`
          : "Date"
      }
    >
      {isSkeleton ? (
        <span className="h-4 w-4 rounded bg-surface-gray-3" />
      ) : (
        <>
          <span className="text-[10px] leading-none">{dayName}</span>
          <span className="text-xs leading-none font-medium">{dayNumber}</span>
        </>
      )}

      {isNewMonth && monthLabel && !isSkeleton ? (
        <span className="absolute bottom-1 text-[8px] leading-none font-medium uppercase tracking-wide opacity-80">
          {monthLabel}
        </span>
      ) : null}
    </button>
  );
}
