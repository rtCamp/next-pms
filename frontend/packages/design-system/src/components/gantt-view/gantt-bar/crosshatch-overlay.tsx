import { useId } from "react";

interface CrosshatchOverlayProps {
  color: string;
}

export const CrosshatchOverlay = ({ color }: CrosshatchOverlayProps) => {
  const uniqueId = useId().replace(/:/g, "");
  const hatchPatternId = `gantt-hatch-${uniqueId}`;
  const hatchFadeId = `gantt-hatch-fade-${uniqueId}`;
  const hatchMaskId = `gantt-hatch-mask-${uniqueId}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      style={{
        color,
        mixBlendMode: "multiply",
        opacity: 0.5,
      }}
    >
      <defs>
        <pattern
          id={hatchPatternId}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke="currentColor"
            strokeWidth="1"
            shapeRendering="geometricPrecision"
          />
        </pattern>
        <linearGradient id={hatchFadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="76%" stopColor="white" stopOpacity="0.24" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={hatchMaskId}>
          <rect width="100%" height="100%" fill={`url(#${hatchFadeId})`} />
        </mask>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`url(#${hatchPatternId})`}
        mask={`url(#${hatchMaskId})`}
      />
    </svg>
  );
};
