import React from "react";
import { cva } from "class-variance-authority";
import { mergeClassNames as cn } from "../../utils";
import ProgressBar, { type ProgressBarSize } from "../progress-bar";

const indicatorVariants = cva("", {
  variants: {
    tone: {
      burn: "bg-surface-green-5",
      healthy: "bg-surface-green-5",
      moderate: "bg-surface-amber-5",
      over: "bg-surface-red-5",
    },
  },
});

const secondaryVariants = cva("", {
  variants: {
    tone: {
      burn: "bg-surface-green-3",
      healthy: "bg-surface-green-2",
      moderate: "bg-surface-amber-2",
      over: "bg-surface-red-3",
    },
  },
});

function budgetTier(percent: number) {
  if (percent > 80) return "over";
  if (percent >= 60) return "moderate";
  return "healthy";
}

export type BudgetBurnVariant = "tiered" | "burn";

export type BudgetBurnBarProps = {
  value: number;
  secondaryValue?: number;
  maxValue?: number;
  markerValue?: number;
  size?: ProgressBarSize;
  variant?: BudgetBurnVariant;
  className?: string;
};

const BudgetBurnBar: React.FC<BudgetBurnBarProps> = ({
  value,
  secondaryValue,
  maxValue = 100,
  markerValue,
  size,
  variant = "tiered",
  className,
}) => {
  const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const tone = variant === "tiered" ? budgetTier(percent) : "burn";
  const marker =
    markerValue !== undefined && markerValue > 0 && markerValue < maxValue
      ? (markerValue / maxValue) * 100
      : null;

  return (
    <div className={cn("relative w-full", className)}>
      <ProgressBar
        value={value}
        secondaryValue={secondaryValue}
        maxValue={maxValue}
        size={size}
        indicatorClassName={indicatorVariants({ tone })}
        secondaryIndicatorClassName={secondaryVariants({ tone })}
      />
      {marker !== null && (
        <>
          <span
            aria-hidden
            className="absolute bottom-[calc(100%+1px)] h-1 w-px -translate-x-1/2 bg-outline-gray-3"
            style={{ left: `${marker}%` }}
          />
          <span
            aria-hidden
            className="absolute top-[calc(100%+1px)] h-1 w-px -translate-x-1/2 bg-outline-gray-3"
            style={{ left: `${marker}%` }}
          />
        </>
      )}
    </div>
  );
};

export default BudgetBurnBar;
