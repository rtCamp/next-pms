export interface TimeUtilisationRole {
  designation: string;
  billable_hours: number;
  non_billable_hours: number;
}

export interface UtilisationSegment {
  key: "billable" | "non_billable";
  label: string;
  /** Whole-number share of the total hours. */
  value: number;
  dotClass: string;
  fillClass: string;
}

/** The roles' summed hours as rounded shares, in React's order and colours. */
export function utilisationSegments(
  roles: TimeUtilisationRole[],
): UtilisationSegment[] {
  const sum = (key: "billable_hours" | "non_billable_hours") =>
    roles.reduce((total, role) => total + role[key], 0);
  const billable = sum("billable_hours");
  const nonBillable = sum("non_billable_hours");
  const total = billable + nonBillable;
  // Non-billable takes the rest, as React does, so the two add up to 100.
  const billableShare = total > 0 ? Math.round((billable / total) * 100) : 0;
  return [
    {
      key: "billable",
      label: "Billable hours",
      value: billableShare,
      dotClass: "bg-surface-blue-7",
      fillClass: "fill-surface-blue-7",
    },
    {
      key: "non_billable",
      label: "Non-billable hours",
      value: total > 0 ? 100 - billableShare : 0,
      dotClass: "bg-surface-blue-4",
      fillClass: "fill-surface-blue-4",
    },
  ];
}

export const DONUT_SIZE = 130;
const OUTER = DONUT_SIZE / 2;
const INNER = OUTER - 16;
/** Gap between adjacent arcs, in degrees. */
const GAP = 4;

function point(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return `${OUTER + radius * Math.cos(radians)} ${OUTER + radius * Math.sin(radians)}`;
}

/** A ring sector from `start` to `end` degrees, clockwise from the top. */
function sector(start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(OUTER, start)}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${point(OUTER, end)}`,
    `L ${point(INNER, end)}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${point(INNER, start)}`,
    "Z",
  ].join(" ");
}

/** The full grey ring shown when there are no hours (draw with `fill-rule="evenodd"`). */
export const EMPTY_DONUT_PATH = [OUTER, INNER]
  .map(
    (radius) =>
      `M ${OUTER - radius} ${OUTER} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`,
  )
  .join(" ");

export interface DonutArc {
  key: UtilisationSegment["key"];
  /** SVG path of the ring sector. */
  d: string;
  fillClass: string;
}

/**
 * The segments as ring sectors, clockwise from the top with a 4° gap between them, as
 * React's donut. A segment too small to show past the gap is left out; no hours at all
 * gives no arcs.
 */
export function donutArcs(segments: UtilisationSegment[]): DonutArc[] {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return [];
  let cursor = 0;
  return segments.flatMap((segment) => {
    const slot = (segment.value / total) * 360;
    const start = cursor + GAP / 2;
    const end = cursor + slot - GAP / 2;
    cursor += slot;
    return end > start
      ? [
          {
            key: segment.key,
            d: sector(start, end),
            fillClass: segment.fillClass,
          },
        ]
      : [];
  });
}
