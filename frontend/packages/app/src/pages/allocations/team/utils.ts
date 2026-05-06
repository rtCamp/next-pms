import type { Member, Project } from "@next-pms/design-system/components";
import { parseISO } from "date-fns";
import type { TeamAllocationResponse } from "./type";

/**
 * Parses a Frappe datetime string (YYYY-MM-DD HH:mm:ss.ssssss) into a Date.
 * Converts the space separator to 'T' for ISO compatibility.
 */
function parseFrappeDatetime(datetime: string): Date {
  return parseISO(datetime.replace(" ", "T"));
}

/**
 * Gets a unique key for a member based on their ID or name.
 */
function getMemberKey(member: Member) {
  return member.id ?? member.name;
}

/**
 * Appends new members to the current list, avoiding duplicates based on member ID or name.
 */
export function appendMembers(current: Member[], incoming: Member[]) {
  const seen = new Set(current.map(getMemberKey));
  const next = [...current];

  for (const member of incoming) {
    const memberKey = getMemberKey(member);

    if (seen.has(memberKey)) {
      continue;
    }

    seen.add(memberKey);
    next.push(member);
  }

  return next;
}

/**
 * Replaces existing members with incoming members and appends any new members.
 */
export function replaceMembers(current: Member[], incoming: Member[]) {
  const incomingById = new Map(
    incoming.map((member) => [getMemberKey(member), member]),
  );

  const updatedMembers = current.map((member) => {
    const memberKey = getMemberKey(member);
    return incomingById.get(memberKey) ?? member;
  });

  return appendMembers(updatedMembers, incoming);
}

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
        projectId: string;
        customerName: string;
        allocations: {
          id: string;
          employeeId: string;
          projectId: string;
          hours: number;
          startDate: Date;
          endDate: Date;
          billable: boolean;
          tentative: boolean;
          note?: string;
          createdOn?: Date;
          updatedOn?: Date;
          updatedBy?: { name: string; image?: string };
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

    if (!projectMap.has(alloc.project)) {
      const customerName =
        customer[alloc.customer]?.name ?? alloc.customer ?? "";
      projectMap.set(alloc.project, {
        projectName: alloc.project_name || alloc.project,
        projectId: alloc.project,
        customerName,
        allocations: [],
      });
    }

    projectMap.get(alloc.project)!.allocations.push({
      id: alloc.name,
      employeeId: alloc.employee,
      projectId: alloc.project,
      hours: alloc.hours_allocated_per_day,
      startDate: parseISO(alloc.allocation_start_date),
      endDate: parseISO(alloc.allocation_end_date),
      billable: Boolean(alloc.is_billable),
      tentative: alloc.status === "Tentative",
      note: alloc.note ?? undefined,
      createdOn: alloc.creation
        ? parseFrappeDatetime(alloc.creation)
        : undefined,
      updatedOn: alloc.modified
        ? parseFrappeDatetime(alloc.modified)
        : undefined,
      updatedBy: alloc.modified_by
        ? {
            name: alloc.modified_by,
            image: alloc.modified_by_avatar || undefined,
          }
        : undefined,
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
      id: employee.name,
      name: employee.employee_name,
      designation: employee.designation ?? undefined,
      department: employee.department ?? undefined,
      rate: employee.rate ?? undefined,
      capacity: employee.capacity ?? undefined,
      manager: employee.reportingManager ?? undefined,
      image: employee.image ?? undefined,
      projects,
      leaves: memberLeaves,
    };
  });
}
