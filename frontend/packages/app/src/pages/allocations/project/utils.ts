/**
 * External dependencies.
 */
import type {
  ProjectGroup,
  ProjectMember,
} from "@next-pms/design-system/components";
import { formatDateRange } from "@next-pms/design-system/date";
import { parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import {
  calculateAllocationHourlyRate,
  formatAllocationCapacity,
  getAllocationCapacityHoursPerDay,
  mapResourceAllocation,
} from "../utils";
import type {
  Customer,
  ManagerNameMap,
  ProjectAllocationResponse,
  ProjectEmployee,
  ProjectRecord,
  ProjectResourceAllocation,
} from "./type";

/**
 * Normalizes project allocation collections from the API into an array.
 */
function getAllocationList(
  allocations:
    | Record<string, ProjectResourceAllocation>
    | ProjectResourceAllocation[]
    | undefined,
) {
  if (!allocations) {
    return [];
  }

  return Array.isArray(allocations) ? allocations : Object.values(allocations);
}

/**
 * Resolves a customer label from the response lookup and falls back to the id.
 */
function resolveCustomerName(
  customerId: string | null | undefined,
  customerLookup: Record<string, Customer>,
) {
  if (!customerId) {
    return undefined;
  }

  return customerLookup[customerId]?.name ?? customerId;
}

/**
 * Derives the client label shown for a project row from its allocations.
 */
function getProjectClient(
  project: ProjectRecord,
  projectAllocations: ProjectResourceAllocation[],
  customerLookup: Record<string, Customer>,
) {
  const customerId =
    project.customer ??
    projectAllocations.find((allocation) => allocation.customer)?.customer;

  return resolveCustomerName(customerId, customerLookup);
}

/**
 * Gets the hover date range for a project based on its expected start and end dates.
 */
function getProjectHoverDateRange(project: ProjectRecord) {
  const startDate = project.expected_start_date;
  const endDate = project.expected_end_date;

  if (!startDate && !endDate) {
    return undefined;
  }

  if (!startDate || !endDate || startDate === endDate) {
    return formatDateRange(startDate || endDate || "", "", "MMM d");
  }

  return formatDateRange(startDate, endDate, "MMM d");
}

/**
 * Builds the display date range spanning all allocations for a project.
 */
function getProjectDateRange(projectAllocations: ProjectResourceAllocation[]) {
  if (projectAllocations.length === 0) {
    return undefined;
  }

  const [firstAllocation, ...restAllocations] = projectAllocations;
  let startDate = firstAllocation.allocation_start_date;
  let endDate = firstAllocation.allocation_end_date;

  for (const allocation of restAllocations) {
    if (parseISO(allocation.allocation_start_date) < parseISO(startDate)) {
      startDate = allocation.allocation_start_date;
    }

    if (parseISO(allocation.allocation_end_date) > parseISO(endDate)) {
      endDate = allocation.allocation_end_date;
    }
  }

  return startDate === endDate
    ? formatDateRange(startDate, "", "MMM d")
    : formatDateRange(startDate, endDate, "MMM d");
}

/**
 * Groups project allocations by employee for the project Gantt rows.
 */
function getProjectMembers(
  projectAllocations: ProjectResourceAllocation[],
  customerLookup: Record<string, Customer>,
  employees: Record<string, ProjectEmployee>,
  managerNameMap?: ManagerNameMap,
): ProjectMember[] {
  const membersById = new Map<string, ProjectMember>();

  for (const allocation of projectAllocations) {
    const memberId = allocation.employee;
    const member = membersById.get(memberId);
    const employee = employees[memberId];
    const mappedAllocation = mapResourceAllocation(
      allocation,
      resolveCustomerName(allocation.customer, customerLookup),
    );

    if (member) {
      const memberAllocations = member.allocations ?? [];
      memberAllocations.push(mappedAllocation);
      member.allocations = memberAllocations;
      continue;
    }

    membersById.set(memberId, {
      id: memberId,
      name: employee?.employee_name ?? allocation.employee_name ?? memberId,
      designation: employee?.designation ?? undefined,
      department: employee?.department ?? undefined,
      rate:
        calculateAllocationHourlyRate(
          employee?.ctc,
          employee?.custom_working_hours,
          employee?.custom_work_schedule,
          employee?.salary_currency,
        ) || undefined,
      capacity:
        formatAllocationCapacity(
          employee?.custom_working_hours,
          employee?.custom_work_schedule,
        ) || undefined,
      capacityHoursPerDay: getAllocationCapacityHoursPerDay(
        employee?.custom_working_hours,
        employee?.custom_work_schedule,
      ),
      manager: employee?.reports_to
        ? (managerNameMap?.get(employee.reports_to) ??
          employees[employee.reports_to]?.employee_name ??
          undefined)
        : undefined,
      image: employee?.image ?? undefined,
      allocations: [mappedAllocation],
    });
  }

  return [...membersById.values()];
}

/**
 * Maps a single project record from the API into a ProjectGroup.
 */
function mapProjectRecord(
  project: ProjectRecord,
  customerLookup: Record<string, Customer>,
  employees: Record<string, ProjectEmployee>,
  managerNameMap?: ManagerNameMap,
): ProjectGroup {
  const projectAllocations = getAllocationList(project.project_allocations);
  const allocationDateRange = getProjectDateRange(projectAllocations);
  const members = getProjectMembers(
    projectAllocations,
    customerLookup,
    employees,
    managerNameMap,
  );

  return {
    id: project.name,
    name: project.project_name || project.name,
    client: getProjectClient(project, projectAllocations, customerLookup),
    dateRange: allocationDateRange,
    projectDateRange: getProjectHoverDateRange(project) ?? allocationDateRange,
    projectManager: project.custom_project_manager_name ?? undefined,
    weeklyCapacity: project.weekly_capacity ?? undefined,
    members,
  };
}

/**
 * Converts the project allocation API payload into ProjectGroup rows.
 */
export function mapProjectAllocationToProjects(
  response: ProjectAllocationResponse,
  managerNameMap?: ManagerNameMap,
): ProjectGroup[] {
  const employees = response.employees ?? {};

  return response.data.map((project) =>
    mapProjectRecord(project, response.customer, employees, managerNameMap),
  );
}
