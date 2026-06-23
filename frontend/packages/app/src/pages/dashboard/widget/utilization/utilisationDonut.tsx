export type DonutSegment = {
  value: number;
  /** Tailwind text-color class — the arc is stroked with currentColor. */
  colorClass: string;
};

type UtilisationDonutProps = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  /** Geometric gap between adjacent arcs, in degrees. */
  gapDegrees?: number;
};

export function UtilisationDonut({
  segments,
  size = 130,
  strokeWidth = 16,
  gapDegrees = 4,
}: UtilisationDonutProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return null;
  }

  const polar = (angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return [
      center + radius * Math.cos(angleRad),
      center + radius * Math.sin(angleRad),
    ] as const;
  };

  let cursor = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label="Utilisation breakdown"
    >
      {segments.map((segment, index) => {
        const slotAngle = (segment.value / total) * 360;
        const startAngle = cursor + gapDegrees / 2;
        const endAngle = cursor + slotAngle - gapDegrees / 2;
        cursor += slotAngle;
        if (endAngle <= startAngle) {
          return null;
        }
        const [x1, y1] = polar(startAngle);
        const [x2, y2] = polar(endAngle);
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        return (
          <path
            key={index}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            className={segment.colorClass}
          />
        );
      })}
    </svg>
  );
}
