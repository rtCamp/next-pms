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
import { mapResourceAllocation } from "../utils";
import type {
  Customer,
  ProjectAllocationResponse,
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
  projectAllocations: ProjectResourceAllocation[],
  customerLookup: Record<string, Customer>,
) {
  const customerId = projectAllocations.find(
    (allocation) => allocation.customer,
  )?.customer;

  return resolveCustomerName(customerId, customerLookup);
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
): ProjectMember[] {
  const membersById = new Map<string, ProjectMember>();

  for (const allocation of projectAllocations) {
    const memberId = allocation.employee;
    const member = membersById.get(memberId);
    // TODO: Populate tentative and allocation when the project resource API starts
    // returning status/creation/modified/modified_by/modified_by_avatar fields.
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
      name: allocation.employee_name || memberId,
      // TODO: Replace this partial project member data with backend fields when
      // the project resource API exposes image/designation.
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
): ProjectGroup {
  const projectAllocations = getAllocationList(project.project_allocations);
  const members = getProjectMembers(projectAllocations, customerLookup);

  return {
    id: project.name,
    name: project.project_name || project.name,
    client: getProjectClient(projectAllocations, customerLookup),
    dateRange: getProjectDateRange(projectAllocations),
    members,
  };
}

/**
 * Converts the project allocation API payload into ProjectGroup rows.
 */
export function mapProjectAllocationToProjects(
  response: ProjectAllocationResponse,
): ProjectGroup[] {
  return response.data.map((project) =>
    mapProjectRecord(project, response.customer),
  );
}
