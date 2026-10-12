import type { Role } from "./types";

/** Roles that open each area of the app; holding any one of them is enough. */
export const ROLE_ACCESS = {
  leadershipDashboard: [
    "Delivery Manager",
    "Delivery User",
    "Timesheet Manager",
    "System Manager",
  ],
  managerDashboard: [
    "Projects Manager",
    "Projects User",
    "Delivery Manager",
    "Timesheet Manager",
    "System Manager",
  ],
  projects: [
    "Projects Manager",
    "Projects User",
    "Timesheet Manager",
    "Delivery Manager",
    "System Manager",
  ],
  reviewTimesheets: [
    "Timesheet Manager",
    "Timesheet User",
    "Projects Manager",
    "Delivery Manager",
    "System Manager",
  ],
  manageAllocations: [
    "Projects Manager",
    "Projects User",
    "Delivery Manager",
    "System Manager",
  ],
  manageAiAllocations: ["Delivery Manager"],
  notifications: [
    "Delivery Manager",
    "Delivery User",
    "Projects Manager",
    "Projects User",
    "System Manager",
  ],
  systemSettings: ["System Manager", "Delivery Manager"],
} satisfies Record<string, Role[]>;

export function hasAnyRole(roles: readonly Role[], allowed: readonly Role[]) {
  return allowed.some((role) => roles.includes(role));
}
