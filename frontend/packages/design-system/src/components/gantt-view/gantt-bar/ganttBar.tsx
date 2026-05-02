import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CalendarX2 } from "lucide-react";
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "../constants";
import { CrosshatchLayer } from "./crosshatchLayer";
import { useGanttBarResize } from "../hooks/useGanttBarResize";

const ganttBarVariants = cva(
  "group absolute shrink-0 flex items-center gap-1.5 rounded-[9px] mx-0.5 px-2.5 py-2 overflow-hidden whitespace-nowrap",
  {
    variants: {
      variant: {
        full: "bg-surface-green-2 text-ink-green-4",
        under: "bg-surface-amber-2 text-ink-amber-4",
        over: "bg-surface-violet-1 text-ink-violet-1",
        timeoff: "bg-surface-gray-2 text-ink-gray-6 justify-center",
        project:
          "bg-surface-white text-ink-gray-5 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.14)]",
        draft: "bg-surface-gray-3 text-ink-gray-5",
      },
    },
  },
);

interface GanttBarProps
  extends
    VariantProps<typeof ganttBarVariants>,
    React.HTMLAttributes<HTMLDivElement> {
  label: string;
  left: number;
  width: number;
  theme?: "default" | "crosshatch";
  billable?: boolean;
  className?: string;
  resizable?: boolean;
  snapUnitPx?: number;
  onResizeEnd?: (nextWidth: number) => void;
  labelFn?: (liveWidth: number) => string;
}

export const GanttBar = React.forwardRef<HTMLDivElement, GanttBarProps>(
  function GanttBar(
    {
      variant,
      label,
      left,
      width,
      theme = "default",
      billable,
      className,
      resizable = false,
      snapUnitPx,
      onResizeEnd,
      labelFn,
      ...divProps
    },
    ref,
  ) {
    const isTimeoff = variant === "timeoff";
    const isCrosshatch = theme === "crosshatch";
    const { liveWidth, handlePointerDown, handlePointerMove, endResize } =
      useGanttBarResize({
        width,
        snapUnitPx: resizable ? snapUnitPx : undefined,
        onResizeEnd: resizable ? onResizeEnd : undefined,
      });

    return (
      <div
        ref={ref}
        className={cn(ganttBarVariants({ variant }), className)}
        {...divProps}
        style={{
          ...divProps.style,
          left: Math.max(left - BAR_MARGIN / 2, 0),
          width: Math.max(liveWidth - BAR_MARGIN, 0),
          height: BAR_HEIGHT,
          top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
        }}
      >
        {!isTimeoff && variant !== "draft" && isCrosshatch && (
          <CrosshatchLayer variant={variant ?? "project"} />
        )}
        {isTimeoff ? (
          <>
            <CalendarX2 className="shrink-0" size={16} strokeWidth={1.5} />
            {label ? (
              <span className="text-[13px] font-medium tracking-[0.02em] truncate">
                {label}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span className="text-[13px] font-medium tracking-[0.02em] truncate">
              {labelFn ? labelFn(liveWidth) : label}
            </span>
            {billable === false ? (
              <span className="block ml-1 w-1 h-1 rounded-full bg-surface-amber-3"></span>
            ) : null}
            {resizable ? (
              <span
                className="opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity block absolute right-2 w-0.5 h-4 bg-surface-gray-4 rounded-2xl touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endResize}
                onPointerCancel={endResize}
              />
            ) : null}
          </>
        )}
      </div>
    );
  },
);

GanttBar.displayName = "GanttBar";
