/**
 * External dependencies.
 */
import { lazy } from "react";
import { Route, Outlet, Navigate } from "react-router-dom";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import LayoutWithSidebar from "./layout";
import { useUser } from "./providers/user";
import { Role } from "./types";
/**
 * Lazy load components.
 */
const Dashboard = lazy(() => import("@/pages/dashboard"));
const LeadershipDashboard = lazy(() => import("@/pages/dashboard/leadership"));
const ManagerDashboard = lazy(() => import("@/pages/dashboard/manager"));
const ProjectList = lazy(() => import("@/pages/projects/list"));
const ProjectKanban = lazy(() => import("@/pages/projects/kanban"));
const ProjectDetail = lazy(() => import("@/pages/project-details"));
const NoteEditor = lazy(
  () => import("@/pages/project-details/tabs/notes/editor"),
);
const PersonalTimesheetLayout = lazy(
  () => import("@/pages/timesheet/personal/layout"),
);
const TeamTimesheetLayout = lazy(() => import("@/pages/timesheet/team/layout"));
const ProjectTimesheetLayout = lazy(
  () => import("@/pages/timesheet/project/layout"),
);
const TimesheetPersonal = lazy(() => import("@/pages/timesheet/personal"));
const TimesheetTeam = lazy(() => import("@/pages/timesheet/team"));
const TimesheetProject = lazy(() => import("./pages/timesheet/project"));
const AllocationsProject = lazy(() => import("@/pages/allocations/project"));
const AllocationsTeam = lazy(() => import("@/pages/allocations/team"));
const AllocationsProjectLayout = lazy(
  () => import("@/pages/allocations/project/layout"),
);
const AllocationsTeamLayout = lazy(
  () => import("@/pages/allocations/team/layout"),
);
const NotFound = lazy(() => import("@/pages/404"));

export function Router() {
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
                allowedRoles={["System Manager", "Projects Manager"]}
              />
            }
          >
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
          </Route>
          <Route
            element={<RoleProtectedRoute allowedRoles={["System Manager"]} />}
          >
            <Route
              path={ROUTES["dashboard-leadership"]}
              element={<LeadershipDashboard />}
            />
          </Route>
          <Route
            element={<RoleProtectedRoute allowedRoles={["Projects Manager"]} />}
          >
            <Route
              path={ROUTES["dashboard-manager"]}
              element={<ManagerDashboard />}
            />
          </Route>
          <Route path={ROUTES.project} element={<ProjectList />} />
          <Route path={ROUTES["project-kanban"]} element={<ProjectKanban />} />
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
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

const AuthenticatedRoute = () => {
  const { isLoading: isUserLoading, currentUser } = useUser(({ state }) => ({
    isLoading: state.isLoading,
    currentUser: state.currentUser,
  }));

  if (isUserLoading) {
    return <></>;
  } else if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/next-pms/timesheet");
  }

  if (!isUserLoading && currentUser && currentUser !== "Guest") {
    return <Outlet />;
  }
};

const RoleProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { isLoading, roles } = useUser(({ state }) => ({
    isLoading: state.isLoading,
    roles: state.roles,
  }));

  if (isLoading) {
    return <></>;
  }

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  return hasAccess ? <Outlet /> : <NotFound />;
};
