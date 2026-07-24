/**
 * External dependencies.
 */
import { Route, Outlet, Navigate } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
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

export const routeConfig: Record<
  Exclude<RouteKey, "base" | "dashboard" | "desk" | "apps">,
  RouteConfig
> = {
  "dashboard-leadership": {
    Component: ReactLazyPreload(() => import("@/pages/dashboard/leadership")),
    allowedRoles: ["Delivery Manager", "Delivery User"],
  },
  "dashboard-manager": {
    Component: ReactLazyPreload(() => import("@/pages/dashboard/manager")),
    allowedRoles: ["Projects Manager", "Projects User"],
  },
  project: {
    Component: ReactLazyPreload(() => import("@/pages/projects/list")),
    allowedRoles: ["Projects Manager", "Timesheet Manager", "Projects User"],
  },
  "project-kanban": {
    Component: ReactLazyPreload(() => import("@/pages/projects/kanban")),
    allowedRoles: ["Projects Manager", "Timesheet Manager", "Projects User"],
  },
  task: {
    Component: ReactLazyPreload(() => import("@/pages/tasks/list")),
    allowedRoles: [],
  },
  "timesheet-personal": {
    Component: ReactLazyPreload(() => import("@/pages/timesheet/personal")),
    allowedRoles: [],
  },
  "timesheet-team": {
    Component: ReactLazyPreload(() => import("@/pages/timesheet/team")),
    allowedRoles: ["Timesheet Manager", "Timesheet User", "Projects Manager"],
  },
  "timesheet-project": {
    Component: ReactLazyPreload(() => import("./pages/timesheet/project")),
    allowedRoles: ["Timesheet Manager", "Timesheet User"],
  },
  "allocations-team": {
    Component: ReactLazyPreload(() => import("@/pages/allocations/team")),
    allowedRoles: [],
  },
  "allocations-project": {
    Component: ReactLazyPreload(() => import("@/pages/allocations/project")),
    allowedRoles: [],
  },
  "not-found": {
    Component: ReactLazyPreload(() => import("@/pages/404")),
    allowedRoles: [],
  },
};

export function Router() {
  const LeadershipDashboard = routeConfig["dashboard-leadership"].Component;
  const ManagerDashboard = routeConfig["dashboard-manager"].Component;
  const ProjectList = routeConfig.project.Component;
  const ProjectKanban = routeConfig["project-kanban"].Component;
  const TaskList = routeConfig.task.Component;
  const TimesheetPersonal = routeConfig["timesheet-personal"].Component;
  const TimesheetTeam = routeConfig["timesheet-team"].Component;
  const TimesheetProject = routeConfig["timesheet-project"].Component;
  const AllocationsTeam = routeConfig["allocations-team"].Component;
  const AllocationsProject = routeConfig["allocations-project"].Component;
  const NotFound = routeConfig["not-found"].Component;

  return (
    <Route>
      <Route element={<AuthenticatedRoute />}>
        <Route element={<LayoutWithSidebar />}>
          <Route
            index
            element={<Navigate to={ROUTES["timesheet-personal"]} replace />}
          />
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["dashboard-leadership"].allowedRoles}
              />
            }
          >
            <Route
              path={ROUTES["dashboard-leadership"]}
              element={<LeadershipDashboard />}
            />
          </Route>
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["dashboard-manager"].allowedRoles}
              />
            }
          >
            <Route
              path={ROUTES["dashboard-manager"]}
              element={<ManagerDashboard />}
            />
          </Route>
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["project"].allowedRoles}
              />
            }
          >
            <Route path={ROUTES.project} element={<ProjectList />} />
          </Route>
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={routeConfig["project-kanban"].allowedRoles}
              />
            }
          >
            <Route
              path={ROUTES["project-kanban"]}
              element={<ProjectKanban />}
            />
          </Route>
          <Route path={ROUTES.task} element={<TaskList />} />
          <Route
            path={`${ROUTES.project}/:projectId`}
            element={<ProjectDetail />}
          >
            <Route path="notes/new" element={<NoteEditor />} />
            <Route path="notes/:noteId/edit" element={<NoteEditor />} />
          </Route>
          <Route element={<PersonalTimesheetLayout />}>
            <Route
              path={ROUTES["timesheet-personal"]}
              element={<TimesheetPersonal />}
            />
          </Route>
          <Route element={<TeamTimesheetLayout />}>
            <Route
              path={ROUTES["timesheet-team"]}
              element={<TimesheetTeam />}
            />
          </Route>
          <Route element={<ProjectTimesheetLayout />}>
            <Route
              path={ROUTES["timesheet-project"]}
              element={<TimesheetProject />}
            />
          </Route>
          <Route element={<AllocationsTeamLayout />}>
            <Route
              path={ROUTES["allocations-team"]}
              element={<AllocationsTeam />}
            />
          </Route>
          <Route element={<AllocationsProjectLayout />}>
            <Route
              path={ROUTES["allocations-project"]}
              element={<AllocationsProject />}
            />
          </Route>
        </Route>
      </Route>
      <Route path={ROUTES["not-found"]} element={<NotFound />} />
      <Route path="*" element={<Navigate to={"/not-found"} replace />} />
    </Route>
  );
}

const AuthenticatedRoute = () => {
  const { isLoading: isUserLoading, currentUser } = useUser(({ state }) => ({
    isLoading: state.isLoading,
    currentUser: state.currentUser,
  }));

  if (isUserLoading) {
    return <Spinner isFull />;
  } else if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/next-pms/timesheet");
    return <Spinner isFull />;
  }

  if (!isUserLoading && currentUser && currentUser !== "Guest") {
    return <Outlet />;
  }

  return null;
};

const RoleProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { isLoading, roles } = useUser(({ state }) => ({
    isLoading: state.isLoading,
    roles: state.roles,
  }));

  if (isLoading) {
    return <Spinner isFull />;
  }

  const hasAccess =
    roles.length >= 0
      ? roles.some((role) => allowedRoles.includes(role))
      : true;

  if (!hasAccess) {
    return <Navigate to={ROUTES["not-found"]} replace />;
  }

  return <Outlet />;
};
