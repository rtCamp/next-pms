/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { Route as BaseRoute, Outlet, Navigate } from "react-router";
import { Spinner } from "@next-pms/design-system/components";
import { useDocumentTitle } from "@next-pms/hooks";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import ReactLazyPreload from "@/lib/lazy-preload";
import type { RouteConfig, RouteKey } from "@/types";
import LayoutWithSidebar from "./layout";
import { useUser } from "./providers/user";
import { Role } from "./types";
/**
 * Lazy load components used outside the route config (parameterized and
 * catch-all routes).
 */
const ProjectDetail = ReactLazyPreload(() => import("@/pages/project-details"));
const NoteEditor = ReactLazyPreload(
  () => import("@/pages/project-details/tabs/notes/editor"),
);
/**
 * Lazy load layouts.
 */
const PersonalTimesheetLayout = ReactLazyPreload(
  () => import("@/pages/timesheet/personal/layout"),
);
const TeamTimesheetLayout = ReactLazyPreload(
  () => import("@/pages/timesheet/team/layout"),
);
const ProjectTimesheetLayout = ReactLazyPreload(
  () => import("@/pages/timesheet/project/layout"),
);
const AllocationsProjectLayout = ReactLazyPreload(
  () => import("@/pages/allocations/project/layout"),
);
const AllocationsTeamLayout = ReactLazyPreload(
  () => import("@/pages/allocations/team/layout"),
);

const Route = ({ title, children }: { title: string; children: ReactNode }) => {
  useDocumentTitle(title);

  return children;
};

export const routeConfig: Record<
  Exclude<RouteKey, "base" | "dashboard" | "desk" | "apps">,
  RouteConfig
> = {
  "dashboard-leadership": {
    Component: ReactLazyPreload(() => import("@/pages/dashboard/leadership")),
    allowedRoles: ["Delivery Manager", "Delivery User"],
    title: "Leadership Dashboard",
  },
  "dashboard-manager": {
    Component: ReactLazyPreload(() => import("@/pages/dashboard/manager")),
    allowedRoles: ["Projects Manager", "Projects User"],
    title: "Manager Dashboard",
  },
  project: {
    Component: ReactLazyPreload(() => import("@/pages/projects")),
    allowedRoles: ["Projects Manager", "Timesheet Manager", "Projects User"],
    title: "Projects",
  },
  task: {
    Component: ReactLazyPreload(() => import("@/pages/tasks/list")),
    allowedRoles: [],
    title: "Tasks",
  },
  "timesheet-personal": {
    Component: ReactLazyPreload(() => import("@/pages/timesheet/personal")),
    allowedRoles: [],
    title: "Timesheet",
  },
  "timesheet-team": {
    Component: ReactLazyPreload(() => import("@/pages/timesheet/team")),
    allowedRoles: ["Timesheet Manager", "Timesheet User", "Projects Manager"],
    title: "Team Timesheet",
  },
  "timesheet-project": {
    Component: ReactLazyPreload(() => import("./pages/timesheet/project")),
    allowedRoles: ["Timesheet Manager", "Timesheet User", "Projects Manager"],
    title: "Project Timesheet",
  },
  "allocations-team": {
    Component: ReactLazyPreload(() => import("@/pages/allocations/team")),
    allowedRoles: [],
    title: "Team Allocations",
  },
  "allocations-project": {
    Component: ReactLazyPreload(() => import("@/pages/allocations/project")),
    allowedRoles: [],
    title: "Project Allocations",
  },
  "not-found": {
    Component: ReactLazyPreload(() => import("@/pages/404")),
    allowedRoles: [],
    title: "Page Not Found",
  },
  "no-employee": {
    Component: ReactLazyPreload(() => import("@/pages/noEmployee")),
    allowedRoles: [],
    title: "Access Restricted",
  },
};

export function Router() {
  const LeadershipDashboard = routeConfig["dashboard-leadership"].Component;
  const ManagerDashboard = routeConfig["dashboard-manager"].Component;
  const ProjectList = routeConfig.project.Component;
  const TimesheetPersonal = routeConfig["timesheet-personal"].Component;
  const TimesheetTeam = routeConfig["timesheet-team"].Component;
  const TimesheetProject = routeConfig["timesheet-project"].Component;
  const AllocationsTeam = routeConfig["allocations-team"].Component;
  const AllocationsProject = routeConfig["allocations-project"].Component;
  const TaskList = routeConfig["task"].Component;
  const NotFound = routeConfig["not-found"].Component;
  const NoEmployee = routeConfig["no-employee"].Component;

  return (
    <BaseRoute>
      <BaseRoute element={<AuthenticatedRoute />}>
        <BaseRoute element={<LayoutWithSidebar />}>
          <BaseRoute
            index
            element={<Navigate to={ROUTES["timesheet-personal"]} replace />}
          />
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["dashboard-leadership"].allowedRoles}
              />
            }
          >
            <BaseRoute
              path={ROUTES["dashboard-leadership"]}
              element={
                <Route title={routeConfig["dashboard-leadership"].title}>
                  <LeadershipDashboard />
                </Route>
              }
            />
          </BaseRoute>
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["dashboard-manager"].allowedRoles}
              />
            }
          >
            <BaseRoute
              path={ROUTES["dashboard-manager"]}
              element={
                <Route title={routeConfig["dashboard-manager"].title}>
                  <ManagerDashboard />
                </Route>
              }
            />
          </BaseRoute>
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["project"].allowedRoles}
              />
            }
          >
            <BaseRoute
              path={ROUTES.project}
              element={
                <Route title={routeConfig.project.title}>
                  <ProjectList />
                </Route>
              }
            />
          </BaseRoute>
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["task"].allowedRoles}
              />
            }
          >
            <BaseRoute
              path={ROUTES.task}
              element={
                <Route title={routeConfig.task.title}>
                  <TaskList />
                </Route>
              }
            />
          </BaseRoute>
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["project"].allowedRoles}
              />
            }
          >
            <BaseRoute
              path={`${ROUTES.project}/:projectId`}
              element={<ProjectDetail />}
            >
              <BaseRoute path="notes/new" element={<NoteEditor />} />
              <BaseRoute path="notes/:noteId/edit" element={<NoteEditor />} />
            </BaseRoute>
          </BaseRoute>
          <BaseRoute element={<PersonalTimesheetLayout />}>
            <BaseRoute
              path={ROUTES["timesheet-personal"]}
              element={
                <Route title={routeConfig["timesheet-personal"].title}>
                  <TimesheetPersonal />
                </Route>
              }
            />
          </BaseRoute>
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["timesheet-team"].allowedRoles}
              />
            }
          >
            <BaseRoute element={<TeamTimesheetLayout />}>
              <BaseRoute
                path={ROUTES["timesheet-team"]}
                element={
                  <Route title={routeConfig["timesheet-team"].title}>
                    <TimesheetTeam />
                  </Route>
                }
              />
            </BaseRoute>
          </BaseRoute>
          <BaseRoute
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["timesheet-project"].allowedRoles}
              />
            }
          >
            <BaseRoute element={<ProjectTimesheetLayout />}>
              <BaseRoute
                path={ROUTES["timesheet-project"]}
                element={
                  <Route title={routeConfig["timesheet-project"].title}>
                    <TimesheetProject />
                  </Route>
                }
              />
            </BaseRoute>
          </BaseRoute>
          <BaseRoute element={<AllocationsTeamLayout />}>
            <BaseRoute
              path={ROUTES["allocations-team"]}
              element={
                <Route title={routeConfig["allocations-team"].title}>
                  <AllocationsTeam />
                </Route>
              }
            />
          </BaseRoute>
          <BaseRoute element={<AllocationsProjectLayout />}>
            <BaseRoute
              path={ROUTES["allocations-project"]}
              element={
                <Route title={routeConfig["allocations-project"].title}>
                  <AllocationsProject />
                </Route>
              }
            />
          </BaseRoute>
        </BaseRoute>
      </BaseRoute>
      <BaseRoute
        path={ROUTES["not-found"]}
        element={
          <Route title={routeConfig["not-found"].title}>
            <NotFound />
          </Route>
        }
      />
      <BaseRoute
        path={ROUTES["no-employee"]}
        element={
          <Route title={routeConfig["no-employee"].title}>
            <NoEmployee />
          </Route>
        }
      />
      <BaseRoute path="*" element={<Navigate to={"/not-found"} replace />} />
    </BaseRoute>
  );
}

const AuthenticatedRoute = () => {
  const {
    isLoading: isUserLoading,
    currentUser,
    hasEmployee,
  } = useUser(({ state }) => ({
    isLoading: state.isLoading,
    currentUser: state.currentUser,
    hasEmployee: state.hasEmployee,
  }));

  if (isUserLoading) {
    return <Spinner isFull />;
  }

  if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/next-pms/timesheet");
    return <Spinner isFull />;
  }

  if (hasEmployee === null) {
    return <Spinner isFull />;
  }

  if (!hasEmployee) {
    return <Navigate to={ROUTES["no-employee"]} replace />;
  }

  return <Outlet />;
};

const RoleProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { isLoading, isAppDataLoading, roles } = useUser(({ state }) => ({
    isLoading: state.isLoading,
    isAppDataLoading: state.isAppDataLoading,
    roles: state.roles,
  }));

  if (isLoading || isAppDataLoading) {
    return <Spinner isFull />;
  }

  if (allowedRoles.length == 0) {
    return <Outlet />;
  }

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to={ROUTES["not-found"]} replace />;
  }

  return <Outlet />;
};
