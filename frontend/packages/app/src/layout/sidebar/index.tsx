/**
 * External dependencies.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Sidebar as BaseSidebar, Batches, Notifications, People, Reports, Tasks, Time } from "@rtcamp/frappe-ui-react";
import {
  ArrowLeftToLine,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  FolderDot,
  FolderKanban,
  BookUser,
  GanttChartSquareIcon,
  Home,
  Users,
  LucideSettings,
  LucideUser,
  LogOut,
  Moon,
  ArrowLeftRight,
  LayoutGrid,
  Sun,
  Search,
  Folder,
  Layers,
} from "lucide-react";
/**
 * Internal dependencies.
 */
import { HOME, PROJECT, RESOURCE_MANAGEMENT, ROLES, TASK, TEAM, TIMESHEET, DESK } from "@/lib/constant";
import { setLocalStorage } from "@/lib/storage";
import { checkIsMobile, mergeClassNames } from "@/lib/utils";
import { setSidebarCollapsed } from "@/store/user";
import type { NestedRoute, Route } from "./types";
import UserNavigation from "./userNavigation";
import ViewLoader from "./viewLoader";
import logo from "@/logo.svg";
import { RootState } from "@/store";
import type { ViewData } from "@/store/view";
import { ErrorFallback } from "@next-pms/design-system/components";
import { useContextSelector } from "use-context-selector";
import { UserContext } from "@/lib/UserProvider";
import { useTheme } from "@/providers/theme/hook";

const Sidebar = () => {
  const user = useSelector((state: RootState) => state.user);
  const { theme, isDarkThemeOnSystem, setTheme } = useTheme();
  const logout = useContextSelector(UserContext, (value) => value.actions.logout);
  const changeTheme = () => {
    if (theme === "system") {
      setTheme(isDarkThemeOnSystem ? "light" : "dark");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };
  const navigate = useNavigate();
  const viewInfo = useSelector((state: RootState) => state.view);
  const dispatch = useDispatch();
  const location = useLocation();

  const [openRoutes, setOpenRoutes] = useState<{ [key: string]: boolean }>({
    reports: false,
  });

  const hasPmRole = user.roles.some((role: string) => ROLES.includes(role));
  const privateViews = viewInfo.views.filter(
    (view: ViewData) => view.user === user.user && !view.default && !view.public,
  );
  const publicViews = viewInfo.views.filter((view: ViewData) => view.public && !view.default);
  const routes: Array<Route> = [
    {
      to: HOME,
      icon: Home,
      label: "Home",
      key: "home",
      isPmRoute: true,
    },
    {
      to: TIMESHEET,
      icon: Clock3,
      label: "Timesheet",
      key: "timesheet",
      isPmRoute: false,
    },
    {
      to: TEAM,
      icon: Users,
      label: "Team",
      key: "team",
      isPmRoute: true,
    },
    {
      to: PROJECT,
      icon: FolderDot,
      label: "Project",
      key: "project",
      isPmRoute: true,
    },
    {
      to: TASK,
      icon: ClipboardList,
      label: "Task",
      key: "task",
      isPmRoute: false,
    },
  ];
  if (!user.roles.includes("Contractor") || user.userName == "Administrator") {
    routes.push({
      to: RESOURCE_MANAGEMENT,
      label: "Resource Management",
      key: "resource-management",
      isPmRoute: false,
      children: [
        {
          to: RESOURCE_MANAGEMENT + "/timeline",
          label: "Timeline",
          key: "timeline-view",
          icon: GanttChartSquareIcon,
        },
        {
          to: RESOURCE_MANAGEMENT + "/team",
          label: "Team",
          key: "team-view",
          icon: BookUser,
        },
        {
          to: RESOURCE_MANAGEMENT + "/project",
          label: "Project",
          key: "project-view",
          icon: FolderKanban,
        },
      ],
    });
  }
  const toggleNestedRoutes = (key: string) => {
    setOpenRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSidebarCollapse = useCallback(() => {
    dispatch(setSidebarCollapsed(checkIsMobile()));
  }, [dispatch]);

  useEffect(() => {
    setLocalStorage("next-pms:isSidebarCollapsed", user.isSidebarCollapsed);
  }, [user.isSidebarCollapsed]);
  useEffect(() => {
    if (checkIsMobile()) {
      dispatch(setSidebarCollapsed(true));
    }
    window.addEventListener("resize", handleSidebarCollapse);
    return () => window.removeEventListener("resize", handleSidebarCollapse);
  }, [dispatch, handleSidebarCollapse]);

  return (
    <ErrorFallback>
      <BaseSidebar
        header={{
          title: "Next PMS",
          subtitle: user.userName,
          logo,
          menuItems: [
            {
              label: "Apps",
              icon: <LayoutGrid size={16} className="text-ink-gray-6 mr-2" />,
              onClick: () => {
                window.location.assign("/apps");
              },
            },
            {
              label: "Switch To Desk",
              icon: <ArrowLeftRight size={16} className="text-ink-gray-6 mr-2" />,
              onClick: () => {
                window.location.assign(DESK);
              },
            },
            {
              label: "Toggle Theme",
              icon:
                theme === "dark" ? <Sun className="text-ink-gray-6 mr-2" /> : <Moon className="text-ink-gray-6 mr-2" />,
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
              },
              {
                label: "Search",
                icon: Search,
                to: "",
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
              },
              {
                label: "Tasks",
                icon: Tasks,
                to: "",
              },
              {
                label: "Projects",
                icon: Folder,
                to: "",
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
                to: "",
              },
              {
                label: "Team",
                icon: People,
                to: "",
              },
              {
                label: "Projects",
                icon: Folder,
                to: "",
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
              },
              {
                label: "Roadmap",
                icon: Layers,
                to: "",
              },
              {
                label: "Reports",
                icon: Reports,
                to: "",
              },
            ],
          },
        ]}
      />
    </ErrorFallback>
  );
};

export default Sidebar;
