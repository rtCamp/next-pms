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
  const { theme, changeTheme } = useTheme();
  const logout = useContextSelector(UserContext, (value) => value.actions.logout);
  const navigate = useNavigate();
  const viewInfo = useSelector((state: RootState) => state.view);
  const dispatch = useDispatch();
  const { pathname } = useLocation();

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
                isActive: pathname === "/",
                onClick: () => navigate("/"),
              },
              {
                label: "Tasks",
                icon: Tasks,
                to: "",
                isActive: pathname.startsWith("/task"),
                onClick: () => navigate("/tasks"),
              },
              {
                label: "Projects",
                icon: Folder,
                to: "",
                isActive: pathname.startsWith("/project"),
                onClick: () => navigate("/project"),
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
                isActive: pathname.startsWith("/timesheet/personal"),
                onClick: () => navigate("/timesheet/personal"),
              },
              {
                label: "Team",
                icon: People,
                isActive: pathname.startsWith("/timesheet/team"),
                onClick: () => navigate("/timesheet/team"),
              },
              {
                label: "Projects",
                icon: Folder,
                isActive: pathname.startsWith("/timesheet/project"),
                onClick: () => navigate("/timesheet/project"),
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
                onClick: () => navigate("/allocation"),
              },
              {
                label: "Roadmap",
                icon: Layers,
                to: "",
                isActive: false,
                onClick: () => navigate("/roadmap"),
              },
              {
                label: "Reports",
                icon: Reports,
                to: "",
                isActive: false,
                onClick: () => navigate("/report"),
              },
            ],
          },
        ]}
      />
    </ErrorFallback>
  );
};

export default Sidebar;
