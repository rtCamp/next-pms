/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ErrorFallback, Typography, Button } from "@next-pms/design-system/components";
import {
  ArrowLeftToLine,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  FolderDot,
  GanttChart,
  FolderKanban,
  BookUser,
} from "lucide-react";
import { Home, Users } from "lucide-react";
/**
 * Internal dependencies.
 */

import { HOME, PROJECT, RESOURCE_MANAGEMENT, ROLES, TASK, TEAM, TIMESHEET } from "@/lib/constant";
import { cn } from "@/lib/utils";
import { setSidebarCollapsed } from "@/store/user";
import UserNavigation from "./userNavigation";
import ViewLoader from "./viewLoader";
import logo from "../../../logo.svg";
import { RootState } from "../../../store";
import { ViewData } from "../../../store/view";

type NestedRoute = {
  to: string;
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
};

type Route = {
  to: string;
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  children?: NestedRoute[];
  isPmRoute: boolean;
};

const Sidebar = () => {
  const user = useSelector((state: RootState) => state.user);
  const viewInfo = useSelector((state: RootState) => state.view);
  const screenSize = useSelector((state: RootState) => state.app.screenSize);

  const dispatch = useDispatch();
  const location = useLocation();

  const [openRoutes, setOpenRoutes] = useState<{ [key: string]: boolean }>({
    reports: false,
  });

  const hasPmRole = user.roles.some((role: string) => ROLES.includes(role));
  const privateViews = viewInfo.views.filter(
    (view: ViewData) => view.user === user.user && !view.default && !view.public
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
    {
      to: RESOURCE_MANAGEMENT,
      icon: GanttChart,
      label: "Resource Management",
      key: "resource-management",
      isPmRoute: false,
      children: [
        {
          to: RESOURCE_MANAGEMENT + "/team",
          label: "Team View",
          key: "team-view",
          icon: BookUser,
        },
        {
          to: RESOURCE_MANAGEMENT + "/project",
          label: "Project View",
          key: "project-view",
          icon: FolderKanban,
        },
      ],
    },
  ];
  const toggleNestedRoutes = (key: string) => {
    setOpenRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCollapse = () => {
    dispatch(setSidebarCollapsed(!user.isSidebarCollapsed));
  };
  useEffect(() => {
    if (screenSize === "sm" || screenSize === "md") {
      dispatch(setSidebarCollapsed(true));
    } else {
      dispatch(setSidebarCollapsed(false));
    }
  }, [screenSize]);

  return (
    <ErrorFallback>
      <aside
        className={cn(
          "bg-slate-100  w-1/5 transition-all duration-300 ease-in-out px-4 py-4 flex flex-col ",
          user.isSidebarCollapsed && "w-16 items-center"
        )}
      >
        <div className={cn("flex shrink-0 gap-x-2 items-center ", !user.isSidebarCollapsed && "px-2")} id="app-logo">
          <img
            src={logo}
            alt="app-logo"
            className=" w-8 h-auto max-xl:w-7 max-xl:h-7 transition-all duration-300 ease-in-out max-lg:w-7 max-lg:h-7 max-md:w-7 max-md:h-7"
          />
          <Typography
            title="Next PMS"
            variant="h5"
            className={cn(
              "transition-all cursor-pointer duration-300 truncate ease-in-out max-md:hidden ",
              user.isSidebarCollapsed && "hidden"
            )}
          >
            Next PMS
          </Typography>
        </div>
        <div className="overflow-y-auto no-scrollbar">
          <div className="pt-3 h-fit  flex flex-col gap-y-2 transition-all duration-300 ease-in-out">
            {routes.map((route: Route) => {
              if (route.isPmRoute && !hasPmRole) return null;
              return route.children ? (
                <div key={route.key}>
                  <Button
                    variant="ghost"
                    title={route.label}
                    className={cn(
                      "flex items-center gap-x-2 w-full text-left p-2 hover:bg-slate-200 rounded-lg",
                      openRoutes[route.key] && "bg-slate-200",
                      user.isSidebarCollapsed && "hidden"
                    )}
                    onClick={() => toggleNestedRoutes(route.key)}
                  >
                    <route.icon className="w-4 h-4 shrink-0" />
                    <Typography
                      variant="p"
                      className={cn(
                        "transition-all duration-300 ease-in-out truncate",
                        user.isSidebarCollapsed && "hidden"
                      )}
                    >
                      {route.label}
                    </Typography>
                    {openRoutes[route.key] ? (
                      <ChevronUp className="ml-auto w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronDown className="ml-auto w-4 h-4 shrink-0" />
                    )}
                  </Button>
                  <div
                    className={cn(
                      "transition-all duration-300 ease-in-out flex flex-col gap-y-1",
                      openRoutes[route.key] ? "flex" : "hidden",
                      !user.isSidebarCollapsed && "pl-2 pt-2",
                      user.isSidebarCollapsed && "flex"
                    )}
                  >
                    {route.children.map((child: NestedRoute) => {
                      const isChildActive = child.to === location.pathname;
                      return (
                        <NavLink
                          to={child.to}
                          key={child.key}
                          title={child.label}
                          className="transition-all duration-300 ease-in-out flex items-center h-9"
                        >
                          <div
                            className={cn(
                              "flex w-full p-2 rounded-lg items-center py-2 hover:bg-slate-200 text-primary gap-x-2 max-md:justify-center",
                              isChildActive && "bg-primary shadow-md hover:bg-slate-700 ",
                              !user.isSidebarCollapsed && "pl-3"
                            )}
                          >
                            {child.icon && (
                              <child.icon
                                className={cn("shrink-0 stroke-primary h-4 w-4", isChildActive && "stroke-background")}
                              />
                            )}
                            <Typography
                              variant="p"
                              className={cn(
                                "transition-all duration-300 ease-in-out text-white truncate",
                                !isChildActive && "text-primary",
                                user.isSidebarCollapsed && "hidden"
                              )}
                            >
                              {child.label}
                            </Typography>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <NavLink
                  to={route.to}
                  key={route.key}
                  title={route.label}
                  className="transition-all duration-300 ease-in-out flex items-center h-9"
                >
                  {({ isActive }) => (
                    <div
                      className={cn(
                        "flex w-full pl-2 rounded-lg items-center p-2 hover:bg-slate-200 text-primary gap-x-2 max-md:justify-center",
                        isActive && "bg-primary shadow-md hover:bg-slate-700 "
                      )}
                    >
                      <route.icon className={cn("shrink-0 stroke-primary h-4 w-4", isActive && "stroke-background")} />
                      <Typography
                        variant="p"
                        className={cn(
                          "transition-all duration-300 ease-in-out text-white",
                          !isActive && "text-primary",
                          user.isSidebarCollapsed && "hidden"
                        )}
                      >
                        {route.label}
                      </Typography>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
          <ViewLoader
            label="Private Views"
            isSidebarCollapsed={user.isSidebarCollapsed}
            openRoutes={openRoutes}
            hasPmRole={hasPmRole}
            id="private_view"
            views={privateViews}
            onClick={() => toggleNestedRoutes("private_view")}
          />
          <ViewLoader
            label="Public Views"
            isSidebarCollapsed={user.isSidebarCollapsed}
            openRoutes={openRoutes}
            hasPmRole={hasPmRole}
            views={publicViews}
            id="public_view"
            onClick={() => toggleNestedRoutes("public_view")}
          />
        </div>
        <div className="grow"></div>
        <div className={cn("flex justify-between items-center", user.isSidebarCollapsed && "flex-col ")}>
          <UserNavigation />
          {screenSize !== "sm" && screenSize !== "md" && (
            <Button
              variant="ghost"
              className="justify-end shrink-0 gap-x-2 transition-all duration-300 ease-in-out h-6"
              onClick={handleCollapse}
            >
              <ArrowLeftToLine
                className={cn(
                  "stroke-primary h-4 w-4 transition-all duration-600",
                  user.isSidebarCollapsed && "rotate-180"
                )}
              />
            </Button>
          )}
        </div>
      </aside>
    </ErrorFallback>
  );
};

export default Sidebar;
