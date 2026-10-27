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
  const share = (hours: number) =>
    total > 0 ? Math.round((hours / total) * 100) : 0;
  return [
    {
      key: "billable",
      label: "Billable hours",
      value: share(billable),
      dotClass: "bg-surface-blue-7",
      fillClass: "fill-surface-blue-7",
    },
    {
      key: "non_billable",
      label: "Non-billable hours",
      value: share(nonBillable),
      dotClass: "bg-surface-blue-4",
      fillClass: "fill-surface-blue-4",
    },
  ];
}
