import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CalendarX2 } from "lucide-react";
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "../constants";
import { CrosshatchLayer } from "./crosshatchLayer";
import { useGanttBarInteraction } from "../hooks/useGanttBarInteraction";

export interface GanttBarRenderState {
  liveLeft: number;
  liveWidth: number;
}

const ganttBarVariants = cva(
  "group absolute shrink-0 flex items-center gap-1.5 rounded-[9px] mx-0.5 px-2.5 py-2 whitespace-nowrap",
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
  movable?: boolean;
  resizable?: boolean;
  snapUnitPx?: number;
  minLeft?: number;
  maxRight?: number;
  onMoveEnd?: (nextLeft: number) => void;
  onResizeEnd?: (nextWidth: number) => void;
  resetLeftOnMoveEnd?: boolean;
  resetWidthOnResizeEnd?: boolean;
  renderLabel?: (state: GanttBarRenderState) => React.ReactNode;
  renderFloatingLabel?: (state: GanttBarRenderState) => React.ReactNode;
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
      movable = false,
      resizable = false,
      snapUnitPx,
      minLeft,
      maxRight,
      onMoveEnd,
      onResizeEnd,
      resetLeftOnMoveEnd = false,
      resetWidthOnResizeEnd = false,
      renderLabel,
      renderFloatingLabel,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      style,
      ...htmlProps
    },
    ref,
  ) {
    const isTimeoff = variant === "timeoff";
    const isCrosshatch = theme === "crosshatch";
    const isInteractive = movable || resizable || typeof onClick === "function";
    const showPointerCursor = typeof onClick === "function" && !movable;
    const {
      isInteracting,
      liveLeft,
      liveWidth,
      handleClick,
      handleRootPointerDown,
      handleRootPointerMove,
      handleRootPointerUp,
      handleRootPointerCancel,
      handleResizePointerDown,
      handleResizePointerMove,
      handleResizePointerUp,
      handleResizePointerCancel,
    } = useGanttBarInteraction({
      left,
      width,
      movable,
      snapUnitPx,
      minLeft,
      maxRight,
      onMoveEnd: movable ? onMoveEnd : undefined,
      onResizeEnd: resizable ? onResizeEnd : undefined,
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      resetLeftOnMoveEnd,
      resetWidthOnResizeEnd,
    });

    return (
      <div
        ref={ref}
        data-gantt-bar="true"
        className={cn(
          ganttBarVariants({ variant }),
          movable && "cursor-grab active:cursor-grabbing touch-none",
          showPointerCursor && "cursor-pointer",
          className,
        )}
        {...htmlProps}
        onClick={isInteractive ? handleClick : onClick}
        onPointerDown={isInteractive ? handleRootPointerDown : onPointerDown}
        onPointerMove={isInteractive ? handleRootPointerMove : onPointerMove}
        onPointerUp={isInteractive ? handleRootPointerUp : onPointerUp}
        onPointerCancel={
          isInteractive ? handleRootPointerCancel : onPointerCancel
        }
        style={{
          ...style,
          left: Math.max(liveLeft - BAR_MARGIN / 2, 0),
          width: Math.max(liveWidth - BAR_MARGIN, 0),
          height: BAR_HEIGHT,
          top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
          zIndex: isInteracting ? 5 : style?.zIndex,
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
              {renderLabel ? renderLabel({ liveLeft, liveWidth }) : label}
            </span>
            {billable === false ? (
              <span className="block ml-1 w-1 h-1 rounded-full bg-surface-amber-3"></span>
            ) : null}
            {resizable ? (
              <span
                className="absolute inset-y-0 right-0 flex w-3.5 cursor-ew-resize items-center justify-end pr-2 touch-none"
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerCancel}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="pointer-events-none block h-4 w-0.5 rounded-2xl bg-surface-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            ) : null}
            {renderFloatingLabel ? (
              <span className="pointer-events-none absolute right-0 top-full mt-1 pr-2 whitespace-nowrap text-[13px] font-medium text-ink-gray-6">
                {renderFloatingLabel({ liveLeft, liveWidth })}
              </span>
            ) : null}
          </>
        )}
      </div>
    );
  },
);

GanttBar.displayName = "GanttBar";
