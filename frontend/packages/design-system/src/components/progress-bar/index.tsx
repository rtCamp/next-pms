import React from "react";
import { mergeClassNames as cn } from "../../utils";

const SIZE = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
} as const;

export type ProgressBarSize = keyof typeof SIZE;

export type ProgressBarProps = {
  value: number;
  secondaryValue?: number;
  maxValue?: number;
  markerValue?: number;
  size?: ProgressBarSize;
  className?: string;
  indicatorClassName?: string;
  secondaryIndicatorClassName?: string;
  markerClassName?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  secondaryValue,
  maxValue = 100,
  markerValue,
  size = "md",
  className,
  indicatorClassName,
  secondaryIndicatorClassName,
  markerClassName,
}) => {
  const scale = (v: number) =>
    (Math.max(0, Math.min(maxValue, v)) / maxValue) * 100;
  const primary = scale(value);
  const secondary =
    secondaryValue !== undefined ? scale(secondaryValue) : undefined;
  const marker =
    markerValue !== undefined && markerValue > 0 && markerValue < maxValue
      ? (markerValue / maxValue) * 100
      : undefined;
  const [back, front] =
    secondary !== undefined && secondary > primary
      ? [
          { width: secondary, className: secondaryIndicatorClassName },
          { width: primary, className: indicatorClassName },
        ]
      : [
          { width: primary, className: indicatorClassName },
          secondary !== undefined
            ? { width: secondary, className: secondaryIndicatorClassName }
            : null,
        ];

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={maxValue}
      aria-valuenow={Math.max(0, Math.min(maxValue, value))}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-surface-gray-2",
        SIZE[size],
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 bg-surface-gray-6",
          back.className,
        )}
        style={{ width: `${back.width}%` }}
      />
      {front && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 bg-surface-gray-7",
            front.className,
          )}
          style={{ width: `${front.width}%` }}
        />
      )}
      {marker !== undefined && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 h-2 w-0.5 -translate-x-1/2 bg-surface-gray-3",
            markerClassName,
          )}
          style={{ left: `${marker}%` }}
        />
      )}
    </div>
  );
};

export default ProgressBar;
