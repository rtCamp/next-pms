/**
 * External dependencies.
 */
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ErrorFallback } from "@next-pms/design-system/components";
import {
  Sidebar as BaseSidebar,
  Batches,
  Notifications,
  People,
  Reports,
  Tasks,
  Time,
} from "@rtcamp/frappe-ui-react";
import {
  ArrowLeftRight,
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
import { useUserActions, useUserState } from "@/providers/user";

const Sidebar = () => {
  const { isSidebarCollapsed, employeeName } = useUserState();
  const { updateIsSidebarCollapsed } = useUserActions();
  const { logout } = useUserActions();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
              onClick: changeTheme,
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
              },
            ],
          },
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
                isActive: pathname.startsWith(ROUTES.task),
                onClick: () => navigate(ROUTES.task),
              },
              {
                label: "Projects",
                icon: Folder,
                to: "",
                isActive: pathname.startsWith(ROUTES.project),
                onClick: () => navigate(ROUTES.project),
              },
            ],
          },
          {
            label: "Timesheet",
            collapsible: true,
            items: [
              {
                label: "Personal",
                icon: Time,
                isActive: pathname.startsWith(ROUTES["timesheet-personal"]),
                onClick: () => navigate(ROUTES["timesheet-personal"]),
              },
              {
                label: "Team",
                icon: People,
                isActive: pathname.startsWith(ROUTES["timesheet-team"]),
                onClick: () => navigate(ROUTES["timesheet-team"]),
              },
              {
                label: "Projects",
                icon: Folder,
                isActive: pathname.startsWith(ROUTES["timesheet-project"]),
                onClick: () => navigate(ROUTES["timesheet-project"]),
              },
            ],
          },
          {
            label: "",
            items: [
              {
                label: "Allocation",
                icon: Batches,
                to: "",
                isActive: false,
                onClick: () => navigate(ROUTES.allocation),
              },
              {
                label: "Roadmap",
                icon: Layers,
                to: "",
                isActive: false,
                onClick: () => navigate(ROUTES.roadmap),
              },
              {
                label: "Reports",
                icon: Reports,
                to: "",
                isActive: false,
                onClick: () => navigate(ROUTES.report),
              },
            ],
          },
        ]}
      />
    </ErrorFallback>
  );
};

export default Sidebar;
