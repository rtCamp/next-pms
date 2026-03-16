import React from "react";
import type { ProgressV2Props } from "./types";
import { mergeClassNames as cn } from "../../utils";

const MIN_VALUE = 0;
const MAX_VALUE = 100;

const sizeHeight: Record<NonNullable<ProgressV2Props["size"]>, string> = {
  sm: "h-0.5",
  md: "h-1",
  lg: "h-2",
  xl: "h-3",
  xxl: "h-4",
};

const ProgressV2: React.FC<ProgressV2Props> = ({
  value,
  size = "sm",
  label = "",
  hint,
  intervals = false,
  intervalCount = 6,
  className = "",
  overflowColor = "bg-surface-red-7",
}) => {
  const isOverflow = value > MAX_VALUE;

  // For overflow: calculate the base portion (100%) and overflow portion relative to total
  const baseWidth = isOverflow ? (MAX_VALUE / value) * 100 : value;
  const overflowWidth = isOverflow ? ((value - MAX_VALUE) / value) * 100 : 0;

  // Classes for the progress bar container
  const indicatorContainerClasses = cn(
    sizeHeight[size],
    intervals ? "flex space-x-1" : "relative bg-surface-gray-2",
    "rounded-sm",
    className,
  );

  // How many intervals are filled (for interval mode)
  const filledIntervalCount =
    value > MAX_VALUE
      ? intervalCount
      : Math.round((value / MAX_VALUE) * intervalCount);

  // For overflow in interval mode, calculate how many intervals are "overflow"
  const overflowIntervalCount = isOverflow
    ? Math.round(((value - MAX_VALUE) / value) * intervalCount)
    : 0;
  const baseIntervalCount = filledIntervalCount - overflowIntervalCount;

  return (
    <div className="w-full flex flex-col gap-2.5">
      {(label || hint) && (
        <div className="flex justify-between items-baseline">
          {label ? (
            <span className="text-base font-medium text-ink-gray-8">
              {label}
            </span>
          ) : (
            <span />
          )}

          {hint && <span className="self-end">{hint}</span>}
        </div>
      )}

      <div
        className={indicatorContainerClasses}
        aria-valuemax={MAX_VALUE}
        aria-valuemin={MIN_VALUE}
        aria-valuenow={value}
        role="progressbar"
      >
        {!intervals ? (
          <div className="flex w-full h-full">
            <div
              className="h-full rounded-l-sm bg-surface-gray-4"
              style={{ width: `${baseWidth}%` }}
            />
            {isOverflow && (
              <div
              className={`relative h-full rounded-r-sm ${overflowColor} before:content-[''] before:absolute before:bg-outline-gray-5 before:left-0 before:bottom-0 before:h-[160%] before:w-px`}
                style={{ width: `${overflowWidth}%` }}
              />
            )}
          </div>
        ) : (
          Array.from({ length: intervalCount }, (_, i) => {
            let overflowClass = "bg-surface-gray-2"; // unfilled
            if (i < filledIntervalCount) {
              // Check if this interval is in the overflow range
              if (isOverflow && i >= baseIntervalCount) {
                overflowClass = `${overflowColor} rounded-l-sm`;
              } else {
                overflowClass = "bg-surface-gray-7 rounded-r-sm";
              }
            }
            return <div key={i} className={`w-full h-full ${overflowClass}`} />;
          })
        )}
      </div>
    </div>
  );
};

export default ProgressV2;
