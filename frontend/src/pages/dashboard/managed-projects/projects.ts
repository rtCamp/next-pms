export interface ProjectSummary {
  name: string;
  project_name: string;
  customer: string | null;
  total_hours_purchased: number;
  actual_time: number;
  total_hours_remaining: number;
  billable_hours: number;
  non_billable_hours: number;
}

export function customerOptions(projects: ProjectSummary[]) {
  const customers = new Set(
    projects.flatMap((project) => (project.customer ? [project.customer] : [])),
  );
  return [...customers].map((customer) => ({
    value: customer,
    label: customer,
  }));
}

/** Every project when no customer or every customer is selected, as in React. */
export function filterByCustomers(
  projects: ProjectSummary[],
  selected: string[],
  customerCount: number,
): ProjectSummary[] {
  if (!selected.length || selected.length === customerCount) return projects;
  return projects.filter(
    (project) => project.customer && selected.includes(project.customer),
  );
}
