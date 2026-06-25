/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ErrorFallback,
  GlobalSearch,
  NotificationTray,
} from "@next-pms/design-system/components";
import {
  Sidebar as BaseSidebar,
  type SidebarSectionType,
} from "@rtcamp/frappe-ui-react";
import {
  Notifications,
  People,
  Time,
  SearchAlt,
  Folder,
  Grid,
  LogOut,
} from "@rtcamp/frappe-ui-react/icons";
import { ArrowLeftRight, Briefcase, BarChart2, Moon, Sun } from "lucide-react";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import logo from "@/logo.svg";
import { useNotifications } from "@/providers/notifications";
import { useTheme } from "@/providers/theme/hook";
import { useUser } from "@/providers/user";

const Sidebar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifications = useNotifications(({ state }) => state.notifications);
  const markAsViewed = useNotifications(({ actions }) => actions.markAsViewed);
  const markAllAsViewed = useNotifications(
    ({ actions }) => actions.markAllAsViewed,
  );

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const {
    isSidebarCollapsed,
    employeeName,
    roles,
    updateIsSidebarCollapsed,
    logout,
  } = useUser(({ state, actions }) => ({
    isSidebarCollapsed: state.isSidebarCollapsed,
    employeeName: state.employeeName,
    roles: state.roles,
    updateIsSidebarCollapsed: actions.updateIsSidebarCollapsed,
    logout: actions.logout,
  }));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const leadershipDashboard = {
    label: "Leadership",
    icon: BarChart2,
    isActive: pathname === ROUTES["dashboard-leadership"],
    onClick: () => navigate(ROUTES["dashboard-leadership"]),
  };

  const managerDashbaord = {
    label: "Manager",
    icon: Briefcase,
    isActive: pathname === ROUTES["dashboard-manager"],
    onClick: () => navigate(ROUTES["dashboard-manager"]),
  };

  const dashboardItems: SidebarSectionType["items"] = [];

  if (roles.includes("System Manager")) {
    dashboardItems.push(leadershipDashboard);
  }
  if (roles.includes("Projects Manager")) {
    dashboardItems.push(managerDashbaord);
  }

  const personalTimesheet = {
    label: "Personal",
    icon: Time,
    isActive: pathname === ROUTES["timesheet-personal"],
    onClick: () => navigate(ROUTES["timesheet-personal"]),
  };

  const teamTimesheet = {
    label: "Team",
    icon: People,
    isActive: pathname === ROUTES["timesheet-team"],
    onClick: () => navigate(ROUTES["timesheet-team"]),
  };

  const projectTimesheet = {
    label: "Projects",
    icon: Folder,
    isActive: pathname === ROUTES["timesheet-project"],
    onClick: () => navigate(ROUTES["timesheet-project"]),
  };

  const timesheetItems: SidebarSectionType["items"] = [personalTimesheet];

  if (roles.includes("Timesheet Manager") && roles.includes("Timesheet User")) {
    timesheetItems.push(teamTimesheet);
    timesheetItems.push(projectTimesheet);
  }

  const projects = {
    label: "Projects",
    icon: Folder,
    to: "",
    isActive: pathname === ROUTES.project,
    onClick: () => navigate(ROUTES.project),
  };

  const projectItems: SidebarSectionType["items"] = [];

  if (roles.includes("Projects Manager")) {
    projectItems.push(projects);
  }

  const teamAllocation = {
    label: "Team",
    icon: People,
    isActive: pathname === ROUTES["allocations-team"],
    onClick: () => navigate(ROUTES["allocations-team"]),
  };
  const projectAllocation = {
    label: "Projects",
    icon: Folder,
    isActive: pathname === ROUTES["allocations-project"],
    onClick: () => navigate(ROUTES["allocations-project"]),
  };

  const allocationItems: SidebarSectionType["items"] = [
    teamAllocation,
    projectAllocation,
  ];

  const searchItems = [
    {
      label: "Timesheet - Personal",
      action: () => navigate(ROUTES["timesheet-personal"]),
    },
    {
      label: "Allocations - Team",
      action: () => navigate(ROUTES["allocations-team"]),
    },
    {
      label: "Allocations - project",
      action: () => navigate(ROUTES["allocations-project"]),
    },
  ];

  if (roles.includes("System Manager")) {
    searchItems.push({
      label: "Dashboard - Leadership",
      action: () => navigate(ROUTES["dashboard-leadership"]),
    });
  }

  if (roles.includes("Projects Manager")) {
    searchItems.push({
      label: "Dashboard - Manager",
      action: () => navigate(ROUTES["dashboard-manager"]),
    });
    searchItems.push({
      label: "Projects",
      action: () => navigate(ROUTES["project"]),
    });
  }

  if (roles.includes("Timesheet Manager") || roles.includes("Timesheet User")) {
    searchItems.push({
      label: "Timesheet - Team",
      action: () => navigate(ROUTES["timesheet-team"]),
    });
    searchItems.push({
      label: "Timesheet - Projects",
      action: () => navigate(ROUTES["timesheet-project"]),
    });
  }

  return (
    <ErrorFallback>
      <BaseSidebar
        collapsed={isSidebarCollapsed}
        onCollapseChange={updateIsSidebarCollapsed}
        activeItemClassName="text-ink-gray-8"
        header={{
          title: "Next PMS",
          subtitle: employeeName,
          logo,
          menuItems: [
            {
              label: "Apps",
              icon: <Grid size={16} className="text-ink-gray-6 mr-2" />,
              onClick: () => {
                window.location.assign(ROUTES.apps);
              },
            },
            {
              label: "Switch To Desk",
              icon: (
                <ArrowLeftRight size={16} className="text-ink-gray-6 mr-2" />
              ),
              onClick: () => {
                window.location.assign(ROUTES.desk);
              },
            },
            {
              label: "Toggle Theme",
              icon:
                theme === "dark" ? (
                  <Sun className="text-ink-gray-6 mr-2" />
                ) : (
                  <Moon className="text-ink-gray-6 mr-2" />
                ),
              onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
            },
            {
              label: "Logout",
              icon: <LogOut size={16} className="text-ink-gray-6 mr-2" />,
              onClick: logout,
            },
          ],
        }}
        sections={[
          {
            label: "",
            items: [
              {
                label: "Notifications",
                icon: Notifications,
                to: "",
                isActive: false,
                onClick: () => setIsNotificationsOpen(true),
              },
              {
                label: "Search",
                icon: SearchAlt,
                to: "",
                isActive: false,
                onClick: () => setIsSearchOpen(true),
              },
              ...projectItems,
            ],
          },
          ...(dashboardItems.length === 1 || timesheetItems.length === 1
            ? [
                {
                  label: "",
                  items: [
                    ...(timesheetItems.length === 1 ? timesheetItems : []),
                    ...(dashboardItems.length === 1 ? dashboardItems : []),
                  ],
                },
              ]
            : []),
          ...(dashboardItems.length > 1
            ? [
                {
                  label: "Dashboards",
                  collapsible: true,
                  items: dashboardItems,
                },
              ]
            : []),
          ...(timesheetItems.length > 1
            ? [
                {
                  label: "Timesheet",
                  collapsible: true,
                  items: timesheetItems,
                },
              ]
            : []),
          {
            label: "Allocations",
            collapsible: true,
            items: allocationItems,
          },
        ]}
      />

      <GlobalSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        items={searchItems}
      />

      <NotificationTray
        open={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
        notifications={notifications}
        offsetClassName={isSidebarCollapsed ? "left-12" : "left-60"}
        onMarkAllRead={markAllAsViewed}
        onNotificationClick={async (notification) => {
          await markAsViewed(notification.id);
          if (notification.href) {
            window.location.assign(notification.href);
          }
        }}
      />
    </ErrorFallback>
  );
};

export default Sidebar;
