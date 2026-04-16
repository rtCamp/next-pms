import { cva, type VariantProps } from "class-variance-authority";
import { mergeClassNames as cn } from "../../../utils";
import { BAR_HEIGHT, CELL_HEIGHT } from "../constants";

const ganttBarVariants = cva(
  "absolute flex items-center gap-1.5 rounded-[9px] mx-0.5 px-2.5 py-2 overflow-hidden whitespace-nowrap",
  {
    variants: {
      variant: {
        full: "bg-surface-green-2 text-ink-green-4",
        under: "bg-surface-amber-2 text-ink-amber-4",
        over: "bg-surface-violet-1 text-ink-violet-1",
        project:
          "bg-surface-white text-ink-gray-5 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.14),0px_1px_3px_0px_rgba(0,0,0,0.14)]",
      },
    },
  },
);

const CROSSHATCH_COLOR_TO_BY_VARIANT: Record<
  NonNullable<VariantProps<typeof ganttBarVariants>["variant"]>,
  string
> = {
  under: "var(--color-ink-amber-3, #B45309)",
  full: "var(--color-ink-green-3, #15803D)",
  over: "var(--color-ink-violet-1, #7C3AED)",
  project: "var(--color-ink-gray-5, #3D3D3D)",
};

const CROSSHATCH_LINE_MASK =
  "repeating-linear-gradient(118deg, transparent 0px, transparent 2px, #000 2px, #000 3px, transparent 3px, transparent 5px)";
const CROSSHATCH_LINE_GRADIENT =
  "linear-gradient(180deg, transparent 0%, transparent 50%, color-mix(in srgb, var(--crosshatch-color-to) 24%, transparent) 76%, var(--crosshatch-color-to) 100%)";

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
  const crosshatchColorTo =
    variant ? CROSSHATCH_COLOR_TO_BY_VARIANT[variant] : "#3D3D3D";
  const isCrosshatch = theme === "crosshatch";

  return (
    <div
      className={cn(ganttBarVariants({ variant }), className)}
      style={{
        left,
        width: width - 2, // Account for 2px margin
        height: BAR_HEIGHT,
        top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
        ["--crosshatch-color-to" as string]:
          isCrosshatch ? crosshatchColorTo : undefined,
      }}
    >
      {isCrosshatch && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: CROSSHATCH_LINE_GRADIENT,
            WebkitMaskImage: CROSSHATCH_LINE_MASK,
            maskImage: CROSSHATCH_LINE_MASK,
            mixBlendMode: "multiply",
            opacity: 0.4,
          }}
        />
      )}
      <span className="text-[13px] font-medium tracking-[0.02em] truncate">{label}</span>
      {billable === false ? (
        <span className="block ml-1 w-1 h-1 rounded-full bg-surface-amber-3"></span>
      ) : null}
    </div>
  );
}

GanttBar.displayName = "GanttBar";
