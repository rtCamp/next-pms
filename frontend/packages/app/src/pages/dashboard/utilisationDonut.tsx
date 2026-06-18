export type DonutSegment = {
  value: number;
  /** Tailwind text-color class — the arc is stroked with currentColor. */
  colorClass: string;
};

type UtilisationDonutProps = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
};

export function UtilisationDonut({
  segments,
  size = 130,
  strokeWidth = 16,
}: UtilisationDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let offset = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      role="img"
    >
      {segments.map((segment, index) => {
        const fraction = total > 0 ? segment.value / total : 0;
        const dash = fraction * circumference;
        const arc = (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            className={segment.colorClass}
          />
        );
        offset += dash;
        return arc;
      })}
    </svg>
  );
}
