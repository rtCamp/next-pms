import { cva, type VariantProps } from "class-variance-authority";
import { CalendarX2 } from "lucide-react";
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, CELL_HEIGHT } from "../constants";
import { CrosshatchLayer } from "./crosshatchLayer";

const ganttBarVariants = cva(
  "absolute shrink-0 flex items-center gap-1.5 rounded-[9px] mx-0.5 px-2.5 py-2 overflow-hidden whitespace-nowrap",
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

interface GanttBarProps extends VariantProps<typeof ganttBarVariants> {
  label: string;
  left: number;
  width: number;
  theme?: "default" | "crosshatch";
  billable?: boolean;
  className?: string;
}

export function GanttBar({
  variant,
  label,
  left,
  width,
  theme = "default",
  billable,
  className,
}: GanttBarProps) {
  const isTimeoff = variant === "timeoff";
  const isCrosshatch = theme === "crosshatch";

  return (
    <div
      className={cn(ganttBarVariants({ variant }), className)}
      style={{
        left,
        width: Math.max(width - 2, 0), // Account for margin
        height: BAR_HEIGHT,
        top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
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
          <span className="text-[13px] font-medium tracking-[0.02em] truncate">
            {label}
          </span>
          {billable === false ? (
            <span className="block ml-1 w-1 h-1 rounded-full bg-surface-amber-3"></span>
          ) : null}
        </>
      )}
    </div>
  );
}

GanttBar.displayName = "GanttBar";
