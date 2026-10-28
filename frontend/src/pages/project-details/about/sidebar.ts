import type { EmployeeLookupOption } from "@/composables/useEmployeeLookup";
import { MEMBER_REMOVE_TOOLTIP } from "@/pages/project-details/help";
import { formatNumber } from "@/utils/format";
import {
  ENGINEERING_MANAGER_ROLE,
  MANAGER_FIELDS,
  PROJECT_MANAGER_ROLE,
  ROLE_LABELS,
} from "./constants";
import type {
  AboutCustomer,
  AboutMember,
  ManagerRole,
  ProjectSidebar,
} from "./types";

export function toMembers(sidebar: ProjectSidebar): AboutMember[] {
  return sidebar.members.map((member) => ({
    userId: member.user,
    name: member.full_name,
    designation: member.designation ?? undefined,
    department: member.department ?? undefined,
    image: member.image ?? undefined,
    phone: member.cell_number ?? undefined,
    rate: member.hourly_rate ?? undefined,
    email: member.company_email || member.user,
    linkedin: member.linkedin_url ?? undefined,
    loggedHours: member.logged_hours ?? undefined,
    totalHoursPurchased: sidebar.progress.total_hours_purchased,
    projectRoles: member.project_roles ?? [],
  }));
}

export function toCustomers(sidebar: ProjectSidebar): AboutCustomer[] {
  return sidebar.customers.map((customer) => ({
    contactId: customer.contact,
    name: customer.full_name,
    designation: customer.designation ?? undefined,
    company: customer.company_name ?? undefined,
    email: customer.email_id ?? undefined,
    image: customer.image ?? undefined,
    phone: customer.phone ?? undefined,
    linkedin: customer.linkedin_url ?? undefined,
  }));
}

/** The project manager, the lead engineer and everyone else. */
export function splitMembers(members: AboutMember[]) {
  const isManager = (member: AboutMember) =>
    member.projectRoles.includes(PROJECT_MANAGER_ROLE) ||
    member.projectRoles.includes(ENGINEERING_MANAGER_ROLE);
  return {
    projectManager: members.find((member) =>
      member.projectRoles.includes(PROJECT_MANAGER_ROLE),
    ),
    engineeringManager: members.find((member) =>
      member.projectRoles.includes(ENGINEERING_MANAGER_ROLE),
    ),
    team: members.filter((member) => !isManager(member)),
  };
}

/** User IDs of the project's billing team. */
export function billingTeamUserIds(sidebar: ProjectSidebar): Set<string> {
  return new Set(
    sidebar.billing_team
      .map((member) => member.user_id)
      .filter((id): id is string => Boolean(id)),
  );
}

/** A member's project roles as the sidebar names them, e.g. `["Lead Engineer"]`. */
export function roleLabels(sidebar: ProjectSidebar, userId: string): string[] {
  const member = sidebar.members.find((m) => m.user === userId);
  return (member?.project_roles ?? []).map((role) => ROLE_LABELS[role] ?? role);
}

/** Why a member can't be removed in the Add members dialog, if they can't. */
export function removeBlockedReason(
  sidebar: ProjectSidebar,
  userId: string,
): string | undefined {
  const labels = roleLabels(sidebar, userId);
  if (labels.length) return MEMBER_REMOVE_TOOLTIP.manager(labels);
  if (billingTeamUserIds(sidebar).has(userId)) {
    return MEMBER_REMOVE_TOOLTIP.billingTeam;
  }
  return undefined;
}

export interface ManagerChange {
  field: (typeof MANAGER_FIELDS)[ManagerRole];
  /** Share the project with this user, who isn't a member yet. */
  shareWith?: string;
  /** Take read access away from the previous manager. */
  unshareFrom?: string;
}

/**
 * The writes a manager change needs, as React does them: set the field, share the
 * project with the new manager, and unshare it from the previous one unless they're
 * still the other manager.
 */
export function planManagerChange(
  role: ManagerRole,
  userId: string | null,
  project: {
    custom_project_manager?: string | null;
    custom_engineering_manager?: string | null;
  },
  memberUserIds: string[],
): ManagerChange {
  const field = MANAGER_FIELDS[role];
  const otherField =
    MANAGER_FIELDS[
      role === "project_manager" ? "engineering_manager" : "project_manager"
    ];
  const previous = project[field] || undefined;
  const other = project[otherField] || undefined;
  return {
    field,
    shareWith: userId && !memberUserIds.includes(userId) ? userId : undefined,
    unshareFrom:
      previous && previous !== userId && previous !== other
        ? previous
        : undefined,
  };
}

/** Employee options for a manager picker: those with a user, keyed by user ID. */
export function managerOptions(
  options: EmployeeLookupOption[],
  current?: AboutMember,
): EmployeeLookupOption[] {
  const mapped = options
    .filter((option) => option.userId)
    .map((option) => ({ ...option, value: option.userId as string }));
  if (current && !mapped.some((option) => option.value === current.userId)) {
    mapped.unshift({
      label: current.name || current.userId,
      value: current.userId,
      image: current.image,
      userId: current.userId,
    });
  }
  return mapped;
}

export function budgetNotSetHint(billingType?: string | null): string {
  return billingType && billingType !== "Non-Billable"
    ? "No submitted Sales Order is linked to this project"
    : "Estimated Cost is not set on this project";
}

export function targetNotSetHint(billingType?: string | null): string {
  return billingType === "Retainer"
    ? "Total Hours Purchased is not set on this project"
    : "Target Hours is not set on this project";
}

/** `"1 hour"`, `"12.5 hours"`. */
export function formatHoursLabel(hours: number): string {
  const text = formatNumber(hours);
  return `${text} ${text === "1" ? "hour" : "hours"}`;
}
