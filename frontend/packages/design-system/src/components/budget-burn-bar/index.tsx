import React from "react";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import { scale } from "./utils";
import { mergeClassNames as cn } from "../../utils";

const SIZE = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
} as const;

export type BudgetBurnBarSize = keyof typeof SIZE;

const primarySegmentVariants = cva("rounded-full cursor-pointer", {
  variants: {
    tone: {
      burn: "bg-surface-green-5",
      healthy: "bg-surface-green-5",
      moderate: "bg-surface-amber-5",
      over: "bg-surface-red-5",
    },
  },
});

const secondarySegmentVariants = cva("rounded-full cursor-pointer", {
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
  primaryTooltip?: React.ReactNode;
  secondaryTooltip?: React.ReactNode;
  markerTooltip?: React.ReactNode;
  size?: BudgetBurnBarSize;
  className?: string;
};

const SegmentTooltip = ({
  content,
  children,
}: {
  content?: React.ReactNode;
  children: React.ReactElement;
}) =>
  content ? (
    typeof content === "string" ? (
      <Tooltip text={content}>{children}</Tooltip>
    ) : (
      <Tooltip body={content}>{children}</Tooltip>
    )
  ) : (
    children
  );

const BudgetBurnBar: React.FC<BudgetBurnBarProps> = ({
  value,
  secondaryValue = 0,
  maxValue = 100,
  markerValue = 0,
  primaryTooltip,
  secondaryTooltip,
  markerTooltip,
  size = "md",
  className,
}) => {
  const primaryPercent = scale(value, maxValue);
  const secondaryPercent = scale(secondaryValue, maxValue);
  const markerPercent = scale(markerValue, maxValue);

  const tierPercent = scale(value + secondaryValue, markerValue || maxValue);

  const tone = budgetTier(tierPercent);

  return (
    <div className={cn("relative w-full", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-valuenow={Math.max(0, Math.min(maxValue, value))}
        className={cn(
          "flex w-full items-stretch gap-px rounded-full bg-surface-gray-2",
          SIZE[size],
        )}
      >
        {primaryPercent > 0 && (
          <SegmentTooltip content={primaryTooltip}>
            <div
              className={primarySegmentVariants({ tone })}
              style={{ width: `${primaryPercent}%` }}
            />
          </SegmentTooltip>
        )}
        {secondaryPercent > 0 && (
          <SegmentTooltip content={secondaryTooltip}>
            <div
              className={secondarySegmentVariants({ tone })}
              style={{ width: `${secondaryPercent}%` }}
            />
          </SegmentTooltip>
        )}
      </div>
      {markerPercent > 0 && (
        <>
          <span
            aria-hidden
            className="absolute bottom-[calc(100%+1px)] h-1 w-px -translate-x-1/2 bg-outline-gray-3"
            style={{ left: `${markerPercent}%` }}
          />
          <span
            aria-hidden
            className="absolute top-[calc(100%+1px)] h-1 w-px -translate-x-1/2 bg-outline-gray-3"
            style={{ left: `${markerPercent}%` }}
          />
          {markerTooltip && (
            <SegmentTooltip content={markerTooltip}>
              <span
                className="absolute -inset-y-1 w-1.5 -translate-x-1/2"
                style={{ left: `${markerPercent}%` }}
              />
            </SegmentTooltip>
          )}
        </>
      )}
    </div>
  );
};

export default BudgetBurnBar;
