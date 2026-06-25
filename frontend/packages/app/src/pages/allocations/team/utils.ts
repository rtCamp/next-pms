import type { Member, Project } from "@next-pms/design-system/components";
import { parseISO } from "date-fns";
import {
  calculateAllocationHourlyRate,
  formatAllocationCapacity,
  getAllocationCapacityHoursPerDay,
  mapResourceAllocationSegments,
} from "../utils";
import type { ManagerNameMap, TeamAllocationResponse } from "./type";

/**
 * Converts a TeamAllocationResponse from the API into a Member[] array
 * suitable for the GanttGrid component.
 *
 * @param response - The API response containing employee and allocation data
 * @param managerNameMap - Optional map to resolve manager names from employee IDs
 */
export function mapTeamAllocationToMembers(
  response: TeamAllocationResponse,
  managerNameMap?: ManagerNameMap,
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
        projectId: string;
        customerName: string;
        allocations: ReturnType<typeof mapResourceAllocationSegments>;
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
      startDate: parseISO(leave.from_date),
      endDate: parseISO(leave.to_date),
    });
    leavesByEmployee.set(leave.employee, employeeLeaves);
  }

  for (const alloc of allocationList) {
    if (!allocationsByEmployee.has(alloc.employee)) {
      allocationsByEmployee.set(alloc.employee, new Map());
    }
    const projectMap = allocationsByEmployee.get(alloc.employee)!;

    const customerName = customer[alloc.customer]?.name ?? alloc.customer ?? "";
    if (!projectMap.has(alloc.project)) {
      projectMap.set(alloc.project, {
        projectName: alloc.project_name || alloc.project,
        projectId: alloc.project,
        customerName,
        allocations: [],
      });
    }

    projectMap
      .get(alloc.project)!
      .allocations.push(...mapResourceAllocationSegments(alloc, customerName));
  }

  return employeeList.map((employee): Member => {
    const projectMap = allocationsByEmployee.get(employee.name);

    const projects: Project[] = projectMap
      ? Array.from(projectMap.entries()).map(
          ([
            projectId,
            { projectName, customerName, allocations },
          ]): Project => ({
            id: projectId,
            name: projectName,
            client: customerName || undefined,
            allocations,
          }),
        )
      : [];

    const memberLeaves = leavesByEmployee.get(employee.name) ?? [];

    return {
      id: employee.name,
      name: employee.employee_name,
      designation: employee.designation ?? undefined,
      department: employee.department ?? undefined,
      rate:
        calculateAllocationHourlyRate(
          employee.ctc,
          employee.custom_working_hours,
          employee.custom_work_schedule,
          employee.salary_currency,
        ) || undefined,
      capacity:
        formatAllocationCapacity(
          employee.custom_working_hours,
          employee.custom_work_schedule,
        ) || undefined,
      capacityHoursPerDay: getAllocationCapacityHoursPerDay(
        employee.custom_working_hours,
        employee.custom_work_schedule,
      ),
      manager: employee.reports_to
        ? managerNameMap?.get(employee.reports_to)
        : undefined,
      image: employee.image ?? undefined,
      projects,
      leaves: memberLeaves,
    };
  });
}
