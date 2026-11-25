import { hasCapability, type Capabilities, type Capability } from "@/session";
import { WHATS_NEW_PATH } from "./constants";

export interface NavItem {
  label: string;
  icon: string;
  to: string;
}

/** A top item that opens a panel instead of a page. */
export interface NavAction {
  label: string;
  icon: string;
  action: "search" | "notifications";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** The Team timesheet, filtered on the user's reports. */
function teamTimesheetLink(employeeId?: string | null): string {
  return employeeId
    ? `/timesheet/team?reportsTo=${encodeURIComponent(employeeId)}`
    : "/timesheet/team";
}

/**
 * @param capabilities The user's capabilities
 * @param employeeId The user's Employee ID; the Team timesheet link filters on
 *   their reports.
 */
export function computeSections(
  capabilities: Capabilities,
  employeeId?: string | null,
): { topItems: (NavItem | NavAction)[]; sections: NavSection[] } {
  const can = (capability: Capability) =>
    hasCapability(capabilities, capability);

  const dashboards: NavItem[] = [
    ...(can("leadership_dashboard")
      ? [
          {
            label: "Leadership",
            icon: "lucide-chart-column",
            to: "/dashboard/leadership",
          },
        ]
      : []),
    ...(can("manager_dashboard")
      ? [
          {
            label: "Manager",
            icon: "lucide-briefcase",
            to: "/dashboard/manager",
          },
        ]
      : []),
  ];

  const team = teamTimesheetLink(employeeId);
  const timesheets: NavItem[] = can("team_timesheet_pages")
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
    { label: "Search", icon: "lucide-search", action: "search" },
    ...(timesheets.length === 1 ? timesheets : []),
    ...(can("notifications")
      ? [
          {
            label: "Notifications",
            icon: "lucide-bell",
            action: "notifications" as const,
          },
        ]
      : []),
    ...(can("projects_page")
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

/** A page offered by the search palette. */
export interface SearchItem {
  label: string;
  to: string;
}

/**
 * The pages the search palette offers the user, in the React app's order and wording.
 * @param employeeId The user's Employee ID; Timesheet - Team filters on their reports.
 * @param hasReleaseNotes Whether the site has release notes, which lists What's new.
 */
export function computeSearchItems(
  capabilities: Capabilities,
  employeeId?: string | null,
  hasReleaseNotes = false,
): SearchItem[] {
  const can = (capability: Capability) =>
    hasCapability(capabilities, capability);
  const team = teamTimesheetLink(employeeId);

  return [
    { label: "Timesheet - Personal", to: "/timesheet" },
    { label: "Allocations - Team", to: "/allocations/team" },
    { label: "Allocations - Project", to: "/allocations/project" },
    { label: "Tasks", to: "/tasks" },
    ...(hasReleaseNotes ? [{ label: "What's new", to: WHATS_NEW_PATH }] : []),
    ...(can("leadership_dashboard")
      ? [{ label: "Dashboard - Leadership", to: "/dashboard/leadership" }]
      : []),
    ...(can("manager_dashboard")
      ? [{ label: "Dashboard - Manager", to: "/dashboard/manager" }]
      : []),
    ...(can("projects_page") ? [{ label: "Projects", to: "/projects" }] : []),
    ...(can("team_timesheet_pages")
      ? [
          { label: "Timesheet - Team", to: team },
          { label: "Timesheet - Projects", to: "/timesheet/project" },
        ]
      : []),
  ];
}
