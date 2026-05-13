import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CalendarX2 } from "lucide-react";
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "../constants";
import { CrosshatchLayer } from "./crosshatchLayer";
import { useGanttBarInteraction } from "../hooks/useGanttBarInteraction";

export interface GanttBarGeometry {
  left: number;
  width: number;
}

export interface GanttBarRenderState {
  isInteracting: boolean;
  liveLeft: number;
  liveWidth: number;
}

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
  minLeft?: number;
  maxRight?: number;
  onResizeEnd?: (geometry: GanttBarGeometry) => void;
  renderLabel?: (state: GanttBarRenderState) => React.ReactNode;
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
      minLeft,
      maxRight,
      onResizeEnd,
      renderLabel,
      onClick,
      style,
      ...htmlProps
    },
    ref,
  ) {
    const isTimeoff = variant === "timeoff";
    const isCrosshatch = theme === "crosshatch";
    const isInteractive = resizable || typeof onClick === "function";
    const showPointerCursor = typeof onClick === "function";
    const {
      isInteracting,
      liveLeft,
      liveWidth,
      handleStartResizePointerDown,
      handleEndResizePointerDown,
      handleResizePointerMove,
      handleResizePointerUp,
      handleResizePointerCancel,
    } = useGanttBarInteraction({
      left,
      width,
      snapUnitPx,
      minLeft,
      maxRight,
      onResizeEnd: resizable ? onResizeEnd : undefined,
    });

    return (
      <div
        ref={ref}
        className={cn(
          ganttBarVariants({ variant }),
          showPointerCursor && "cursor-pointer",
          className,
        )}
        {...htmlProps}
        onClick={isInteractive ? onClick : undefined}
        style={{
          ...style,
          left: Math.max(liveLeft - BAR_MARGIN / 2, 0),
          width: Math.max(liveWidth - BAR_MARGIN, 0),
          height: BAR_HEIGHT,
          top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
          zIndex: isInteracting ? 5 : style?.zIndex,
        }}
      >
        {!isTimeoff && isCrosshatch && (
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
            <span className="min-w-0 flex-1 overflow-hidden text-[13px] font-medium tracking-[0.02em]">
              {renderLabel ? (
                renderLabel({ isInteracting, liveLeft, liveWidth })
              ) : (
                <span className="block truncate">{label}</span>
              )}
            </span>
            {billable === false ? (
              <span className="block ml-1 w-1 h-1 rounded-full bg-surface-amber-3"></span>
            ) : null}
            {resizable ? (
              <>
                <span
                  className="absolute inset-y-0 left-0 w-2.5 pl-1 flex cursor-ew-resize items-center justify-start touch-none"
                  onPointerDown={handleStartResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerCancel}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="pointer-events-none block h-4 w-0.5 rounded-2xl bg-surface-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span
                  className="absolute inset-y-0 right-0 w-2.5 pr-1 flex cursor-ew-resize items-center justify-end touch-none"
                  onPointerDown={handleEndResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerCancel}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="pointer-events-none block h-4 w-0.5 rounded-2xl bg-surface-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </>
            ) : null}
          </>
        )}
      </div>
    );
  },
);

GanttBar.displayName = "GanttBar";
