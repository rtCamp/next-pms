/**
 * External dependencies.
 */
import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import LayoutWithSidebar from "./layout";
import { useUser } from "./providers/user";
/**
 * Lazy load components.
 */
const Home = lazy(() => import("@/pages/home"));
const Task = lazy(() => import("@/pages/task"));
const Projects = lazy(() => import("@/pages/projects"));
const ProjectDetail = lazy(() => import("@/pages/projects/detail"));
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
const Roadmap = lazy(() => import("@/pages/roadmap"));
const Report = lazy(() => import("@/pages/report"));
const NotFound = lazy(() => import("@/pages/404"));

export function Router() {
  return (
    <Route>
      <Route element={<AuthenticatedRoute />}>
        <Route element={<LayoutWithSidebar />}>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.task} element={<Task />} />
          <Route path={ROUTES.project} element={<Projects />} />
          <Route
            path={`${ROUTES.project}/:projectId`}
            element={<ProjectDetail />}
          />
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
          <Route path={ROUTES.roadmap} element={<Roadmap />} />
          <Route path={ROUTES.report} element={<Report />} />
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
