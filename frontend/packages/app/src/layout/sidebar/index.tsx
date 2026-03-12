/**
 * External dependencies.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Sidebar as BaseSidebar, Batches, Notifications, People, Reports, Tasks, Time } from "@rtcamp/frappe-ui-react";
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
import { setLocalStorage } from "@/lib/storage";
import { checkIsMobile } from "@/lib/utils";
import { setSidebarCollapsed } from "@/store/user";
import UserNavigation from "./userNavigation";
import ViewLoader from "./viewLoader";
import logo from "@/logo.svg";
import { RootState } from "@/store";
import type { ViewData } from "@/store/view";
import { ErrorFallback } from "@next-pms/design-system/components";
import { useContextSelector } from "use-context-selector";
import { UserContext } from "@/lib/UserProvider";
import { useTheme } from "@/providers/theme/hook";
import { ROLES, ROUTES } from "@/lib/constant";

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
                window.location.assign(ROUTES.apps);
              },
            },
            {
              label: "Switch To Desk",
              icon: <ArrowLeftRight size={16} className="text-ink-gray-6 mr-2" />,
              onClick: () => {
                window.location.assign(ROUTES.desk);
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
