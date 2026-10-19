export interface TimeUtilisationRole {
  designation: string;
  billable_hours: number;
  non_billable_hours: number;
}

export function utilisationSlices(roles: TimeUtilisationRole[]) {
  const sum = (key: "billable_hours" | "non_billable_hours") =>
    roles.reduce((total, role) => total + role[key], 0);
  return [
    { category: "Billable hours", hours: sum("billable_hours") },
    { category: "Non-billable hours", hours: sum("non_billable_hours") },
  ];
}
