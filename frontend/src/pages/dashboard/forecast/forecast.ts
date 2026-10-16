export interface ForecastRole {
  designation: string;
  allocated_hours: number;
  tentative_hours: number;
  unallocated_hours: number;
}

export interface ForecastSegment {
  key: "allocated" | "tentative" | "unallocated";
  label: string;
  /** Whole-number share of the total hours. */
  value: number;
  colorClass: string;
}

/** The roles' summed hours as rounded shares, in React's order and colours. */
export function forecastSegments(roles: ForecastRole[]): ForecastSegment[] {
  const sum = (key: keyof Omit<ForecastRole, "designation">) =>
    roles.reduce((total, role) => total + role[key], 0);
  const allocated = sum("allocated_hours");
  const tentative = sum("tentative_hours");
  const unallocated = sum("unallocated_hours");
  const total = allocated + tentative + unallocated;
  const share = (hours: number) =>
    total > 0 ? Math.round((hours / total) * 100) : 0;
  return [
    {
      key: "allocated",
      label: "Allocated hours",
      value: share(allocated),
      colorClass: "bg-surface-green-5",
    },
    {
      key: "tentative",
      label: "Tentatively allocated hours",
      value: share(tentative),
      colorClass: "bg-surface-green-4",
    },
    {
      key: "unallocated",
      label: "Unallocated hours",
      value: share(unallocated),
      colorClass: "bg-surface-gray-3",
    },
  ];
}
