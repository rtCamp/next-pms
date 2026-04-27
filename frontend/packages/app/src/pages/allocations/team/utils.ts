import type { Member, Project } from "@next-pms/design-system/components";
import type { TeamAllocationResponse } from "./type";

/**
 * Converts a TeamAllocationResponse from the API into a Member[] array
 * suitable for the GanttGrid component.
 */
export function mapTeamAllocationToMembers(
  response: TeamAllocationResponse,
): Member[] {
  const { employees, resource_allocations, customer, leaves } = response;

  const employeeList = employees ?? [];
  const allocationList = resource_allocations ?? [];
  const leaveList = leaves ?? [];

  // Group allocations by employee, then by project
  const allocationsByEmployee = new Map<
    string,
    Map<
      string,
      {
        projectName: string;
        customerName: string;
        allocations: {
          hours: number;
          startDate: Date;
          endDate: Date;
          billable: boolean;
          tentative: boolean;
        }[];
      }
    >
  >();

  const leavesByEmployee = new Map<
    string,
    { startDate: Date; endDate: Date }[]
  >();

  for (const leave of leaveList) {
    const employeeLeaves = leavesByEmployee.get(leave.employee) ?? [];
    employeeLeaves.push({
      startDate: new Date(leave.from_date),
      endDate: new Date(leave.to_date),
    });
    leavesByEmployee.set(leave.employee, employeeLeaves);
  }

  for (const alloc of allocationList) {
    if (!allocationsByEmployee.has(alloc.employee)) {
      allocationsByEmployee.set(alloc.employee, new Map());
    }
    const projectMap = allocationsByEmployee.get(alloc.employee)!;

    if (!projectMap.has(alloc.project)) {
      const customerName =
        customer[alloc.customer]?.name ?? alloc.customer ?? "";
      projectMap.set(alloc.project, {
        projectName: alloc.project_name || alloc.project,
        customerName,
        allocations: [],
      });
    }

    projectMap.get(alloc.project)!.allocations.push({
      hours: alloc.hours_allocated_per_day,
      startDate: new Date(alloc.allocation_start_date),
      endDate: new Date(alloc.allocation_end_date),
      billable: Boolean(alloc.is_billable),
      tentative: alloc.status === "Tentative",
    });
  }

  return employeeList.map((employee): Member => {
    const projectMap = allocationsByEmployee.get(employee.name);

    const projects: Project[] = projectMap
      ? Array.from(projectMap.entries()).map(
          ([, { projectName, customerName, allocations }]): Project => ({
            name: projectName,
            client: customerName || undefined,
            allocations,
          }),
        )
      : [];

    const memberLeaves = leavesByEmployee.get(employee.name) ?? [];

    return {
      name: employee.employee_name,
      role: employee.designation ?? undefined,
      image: employee.image ?? undefined,
      projects,
      leaves: memberLeaves,
    };
  });
}
