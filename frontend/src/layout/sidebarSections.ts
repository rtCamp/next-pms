import { ROLE_ACCESS, hasAnyRole, type Role } from "@/session";

export interface NavItem {
  label: string;
  icon: string;
  to: string;
}

/** A top item that opens a panel instead of a page. */
export interface NavAction {
  label: string;
  icon: string;
  action: "notifications";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * @param roles The user's roles
 * @param employeeId The user's Employee ID; the Team timesheet link filters on
 *   their reports.
 */
export function computeSections(
  roles: readonly Role[],
  employeeId?: string | null,
): { topItems: (NavItem | NavAction)[]; sections: NavSection[] } {
  const can = (allowed: readonly Role[]) => hasAnyRole(roles, allowed);

  const dashboards: NavItem[] = [
    ...(can(ROLE_ACCESS.leadershipDashboard)
      ? [
          {
            label: "Leadership",
            icon: "lucide-chart-column",
            to: "/dashboard/leadership",
          },
        ]
      : []),
    ...(can(ROLE_ACCESS.managerDashboard)
      ? [
          {
            label: "Manager",
            icon: "lucide-briefcase",
            to: "/dashboard/manager",
          },
        ]
      : []),
  ];

  const team = employeeId
    ? `/timesheet/team?reportsTo=${encodeURIComponent(employeeId)}`
    : "/timesheet/team";
  const timesheets: NavItem[] = can(ROLE_ACCESS.reviewTimesheets)
    ? [
        { label: "Personal", icon: "lucide-clock", to: "/timesheet" },
        { label: "Team", icon: "lucide-users", to: team },
        { label: "Projects", icon: "lucide-folder", to: "/timesheet/project" },
      ]
    : [{ label: "Timesheet", icon: "lucide-clock", to: "/timesheet" }];

  const allocations: NavItem[] = [
    { label: "Team", icon: "lucide-users", to: "/allocations/team" },
    { label: "Projects", icon: "lucide-folder", to: "/allocations/project" },
  ];

  const topItems: (NavItem | NavAction)[] = [
    ...(timesheets.length === 1 ? timesheets : []),
    ...(can(ROLE_ACCESS.notifications)
      ? [
          {
            label: "Notifications",
            icon: "lucide-bell",
            action: "notifications" as const,
          },
        ]
      : []),
    ...(can(ROLE_ACCESS.projects)
      ? [
          {
            label: "Projects",
            icon: "lucide-folder",
            to: "/projects?status=Open",
          },
        ]
      : []),
    { label: "Tasks", icon: "lucide-list-checks", to: "/tasks" },
    ...(dashboards.length === 1 ? dashboards : []),
  ];

  const sections = [
    { label: "Dashboards", items: dashboards },
    { label: "Timesheet", items: timesheets },
    { label: "Allocations", items: allocations },
  ].filter((section) => section.items.length > 1);

  return { topItems, sections };
}
