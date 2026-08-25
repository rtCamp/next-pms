/**
 * External dependencies.
 */
import React from "react";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { TimeOff } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Internal dependencies.
 */
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
  "group pointer-events-auto absolute shrink-0 flex items-center gap-1.5 rounded-[9px] mx-0.5 px-2.5 py-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3",
  {
    variants: {
      variant: {
        full: "bg-surface-green-2 text-ink-green-4",
        under: "bg-surface-amber-2 text-ink-amber-4",
        over: "bg-surface-violet-1 text-ink-violet-4",
        timeoff: "bg-surface-gray-2 text-ink-gray-6 justify-center",
        projectSummary: "bg-surface-blue-2 text-ink-blue-3",
        allocation:
          "bg-surface-white text-ink-gray-5 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.14)]",
        draft: "bg-surface-gray-2 text-ink-gray-5",
        empty: "bg-surface-gray-2/60 text-ink-gray-4",
      },
    },
  },
);

const trailingLabelVariants = cva(
  "min-w-0 flex-1 shrink-0 text-end text-[13px] font-medium tracking-[0.02em] truncate",
  {
    variants: {
      variant: {
        amber: "text-ink-amber-4",
        violet: "text-ink-violet-1",
      },
    },
  },
);

type GanttBarTrailingLabelVariant = NonNullable<
  VariantProps<typeof trailingLabelVariants>["variant"]
>;

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
  showOutline?: boolean;
  resizable?: boolean;
  snapUnitPx?: number;
  minLeft?: number;
  maxRight?: number;
  onResizeEnd?: (geometry: GanttBarGeometry) => void;
  renderLabel?: (state: GanttBarRenderState) => React.ReactNode;
  renderFloatingLabel?: (state: GanttBarRenderState) => React.ReactNode;
  showInlineLabel?: boolean;
  trailingLabel?: React.ReactNode;
  trailingLabelVariant?: GanttBarTrailingLabelVariant;
  /**
   * Renders the bar as a non-interactive background layer: adds
   * pointer-events-none and omits `data-gantt-bar`, so it doesn't trip the
   * row's add-allocation hover/occupancy detection (see RowAllocationOverlay).
   */
  passive?: boolean;
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
      showOutline = false,
      resizable = false,
      snapUnitPx,
      minLeft,
      maxRight,
      onResizeEnd,
      renderLabel,
      renderFloatingLabel,
      showInlineLabel = true,
      trailingLabel,
      trailingLabelVariant,
      passive = false,
      onClick,
      style,
      ...htmlProps
    },
    ref,
  ) {
    const isTimeoff = variant === "timeoff";
    const isCrosshatch = theme === "crosshatch";
    const isResizable = resizable && !passive;
    const showPointerCursor = !passive && typeof onClick === "function";
    const isInteractive = isResizable || showPointerCursor;
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
      onResizeEnd: isResizable ? onResizeEnd : undefined,
    });

    return (
      <div
        ref={ref}
        data-gantt-bar={passive ? undefined : "true"}
        className={cn(
          ganttBarVariants({ variant }),
          isInteracting && "z-5",
          showPointerCursor && "cursor-pointer",
          passive && "pointer-events-none",
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
        }}
      >
        {!isTimeoff &&
          variant !== "draft" &&
          variant !== "empty" &&
          isCrosshatch && <CrosshatchLayer variant={variant ?? "allocation"} />}
        {isTimeoff ? (
          <Tooltip text={label}>
            <div className="absolute inset-0 px-2.5 py-2 w-full flex items-center justify-center gap-1.5">
              <TimeOff
                className="shrink-0 size-4 text-ink-gray-5"
                size={16}
                strokeWidth={1.5}
              />
              {showInlineLabel && label ? (
                <span className="min-w-0 flex-1 overflow-hidden text-[13px] font-medium tracking-[0.02em] truncate">
                  {label}
                </span>
              ) : null}
            </div>
          </Tooltip>
        ) : (
          <>
            <span className="min-w-0 flex-1 overflow-hidden text-[13px] font-medium tracking-[0.02em] truncate">
              {renderLabel ? (
                renderLabel({ isInteracting, liveLeft, liveWidth })
              ) : (
                <span className="block truncate">{label}</span>
              )}
            </span>
            {trailingLabel ? (
              <span
                className={trailingLabelVariants({
                  variant: trailingLabelVariant,
                })}
              >
                {trailingLabel}
              </span>
            ) : null}
            {billable === false ? (
              <span className="block ml-1 w-1 h-1 rounded-full bg-surface-amber-3"></span>
            ) : null}
            {isResizable ? (
              <>
                <span
                  className="absolute shrink-0 inset-y-0 left-0 w-2.5 pl-1 flex cursor-ew-resize items-center justify-start touch-none"
                  onPointerDown={handleStartResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerCancel}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="pointer-events-none shrink-0 block h-4 w-0.5 rounded-2xl bg-surface-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span
                  className="absolute shrink-0 inset-y-0 right-0 w-2.5 pr-1 flex cursor-ew-resize items-center justify-end touch-none"
                  onPointerDown={handleEndResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerCancel}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="pointer-events-none shrink-0 block h-4 w-0.5 rounded-2xl bg-surface-gray-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </>
            ) : null}
            {renderFloatingLabel
              ? renderFloatingLabel({
                  isInteracting,
                  liveLeft,
                  liveWidth,
                })
              : null}
          </>
        )}
        {showOutline ? (
          <span className="inline-flex pointer-events-none absolute inset-0 rounded-[9px] border border-dashed border-surface-amber-3"></span>
        ) : null}
      </div>
    );
  },
);

GanttBar.displayName = "GanttBar";
