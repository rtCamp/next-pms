/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ErrorFallback,
  GlobalSearch,
} from "@next-pms/design-system/components";
import { Sidebar as BaseSidebar } from "@rtcamp/frappe-ui-react";
import {
  Notifications,
  People,
  Reports,
  Tasks,
  Time,
} from "@rtcamp/frappe-ui-react/icons";
import {
  ArrowLeftRight,
  BarChart2,
  Briefcase,
  Folder,
  Home,
  Layers,
  LayoutGrid,
  LogOut,
  Moon,
  Search,
  Sun,
} from "lucide-react";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import logo from "@/logo.svg";
import { useTheme } from "@/providers/theme/hook";
import { useUser } from "@/providers/user";

const Sidebar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const canSeeDashboard =
    roles.includes("Projects Manager") || roles.includes("Delivery Manager");

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

  return (
    <ErrorFallback>
      <BaseSidebar
        collapsed={isSidebarCollapsed}
        onCollapseChange={updateIsSidebarCollapsed}
        header={{
          title: "Next PMS",
          subtitle: employeeName,
          logo,
          menuItems: [
            {
              label: "Apps",
              icon: <LayoutGrid size={16} className="text-ink-gray-6 mr-2" />,
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
              },
              {
                label: "Search",
                icon: Search,
                to: "",
                isActive: false,
                onClick: () => setIsSearchOpen(true),
              },
            ],
          },
          ...(canSeeDashboard
            ? [
                {
                  label: "Dashboard",
                  collapsible: true,
                  items: [
                    ...(roles.includes("Delivery Manager")
                      ? [
                          {
                            label: "Leadership",
                            icon: BarChart2,
                            isActive:
                              pathname === ROUTES["dashboard-leadership"],
                            onClick: () =>
                              navigate(ROUTES["dashboard-leadership"]),
                          },
                        ]
                      : []),
                    ...(roles.includes("Projects Manager")
                      ? [
                          {
                            label: "Manager",
                            icon: Briefcase,
                            isActive: pathname === ROUTES["dashboard-manager"],
                            onClick: () =>
                              navigate(ROUTES["dashboard-manager"]),
                          },
                        ]
                      : []),
                  ],
                },
              ]
            : []),
          {
            label: "",
            items: [
              {
                label: "Home",
                icon: Home,
                to: "",
                isActive: pathname === ROUTES.home,
                onClick: () => navigate(ROUTES.home),
              },
              {
                label: "Tasks",
                icon: Tasks,
                to: "",
                isActive: pathname === ROUTES.task,
                onClick: () => navigate(ROUTES.task),
              },
              ...(roles.includes("Projects Manager")
                ? [
                    {
                      label: "Projects",
                      icon: Folder,
                      to: "",
                      isActive: pathname === ROUTES.project,
                      onClick: () => navigate(ROUTES.project),
                    },
                  ]
                : []),
              ...(!roles.includes("Timesheet Manager") &&
              !roles.includes("Timesheet User")
                ? [
                    {
                      label: "Timesheet",
                      icon: Time,
                      to: "",
                      isActive: pathname === ROUTES["timesheet-personal"],
                      onClick: () => navigate(ROUTES["timesheet-personal"]),
                    },
                  ]
                : []),
            ],
          },
          ...(roles.includes("Timesheet Manager") ||
          roles.includes("Timesheet User")
            ? [
                {
                  label: "Timesheet",
                  collapsible: true,
                  items: [
                    {
                      label: "Personal",
                      icon: Time,
                      isActive: pathname === ROUTES["timesheet-personal"],
                      onClick: () => navigate(ROUTES["timesheet-personal"]),
                    },
                    {
                      label: "Team",
                      icon: People,
                      isActive: pathname === ROUTES["timesheet-team"],
                      onClick: () => navigate(ROUTES["timesheet-team"]),
                    },
                    {
                      label: "Projects",
                      icon: Folder,
                      isActive: pathname === ROUTES["timesheet-project"],
                      onClick: () => navigate(ROUTES["timesheet-project"]),
                    },
                  ],
                },
              ]
            : []),
          {
            label: "Allocations",
            collapsible: true,
            items: [
              {
                label: "Team",
                icon: People,
                isActive: pathname === ROUTES["allocations-team"],
                onClick: () => navigate(ROUTES["allocations-team"]),
              },
              {
                label: "Projects",
                icon: Folder,
                isActive: pathname === ROUTES["allocations-project"],
                onClick: () => navigate(ROUTES["allocations-project"]),
              },
            ],
          },
          {
            label: "",
            items: [
              {
                label: "Roadmap",
                icon: Layers,
                to: "",
                isActive: pathname === ROUTES.roadmap,
                onClick: () => navigate(ROUTES.roadmap),
              },
              {
                label: "Reports",
                icon: Reports,
                to: "",
                isActive: pathname === ROUTES.report,
                onClick: () => navigate(ROUTES.report),
              },
            ],
          },
        ]}
      />

      <GlobalSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        items={[
          ...(roles.includes("Delivery Manager")
            ? [
                {
                  label: "Dashboard - Leadership",
                  action: () => navigate(ROUTES["dashboard-leadership"]),
                },
              ]
            : []),
          ...(roles.includes("Projects Manager")
            ? [
                {
                  label: "Dashboard - Manager",
                  action: () => navigate(ROUTES["dashboard-manager"]),
                },
              ]
            : []),
          { label: "Home", action: () => navigate(ROUTES.home) },
          { label: "Tasks", action: () => navigate(ROUTES.task) },
          ...(roles.includes("Projects Manager")
            ? [{ label: "Projects", action: () => navigate(ROUTES.project) }]
            : []),
          {
            label: "Timesheet - Personal",
            action: () => navigate(ROUTES["timesheet-personal"]),
          },
          ...(roles.includes("Timesheet Manager") ||
          roles.includes("Timesheet User")
            ? [
                {
                  label: "Timesheet - Team",
                  action: () => navigate(ROUTES["timesheet-team"]),
                },
                {
                  label: "Timesheet - Projects",
                  action: () => navigate(ROUTES["timesheet-project"]),
                },
              ]
            : []),
          {
            label: "Allocations - Team",
            action: () => navigate(ROUTES["allocations-team"]),
          },
          {
            label: "Allocations - project",
            action: () => navigate(ROUTES["allocations-project"]),
          },
          { label: "Roadmap", action: () => navigate(ROUTES.roadmap) },
          { label: "Reports", action: () => navigate(ROUTES.report) },
        ]}
      />
    </ErrorFallback>
  );
};

export default Sidebar;
