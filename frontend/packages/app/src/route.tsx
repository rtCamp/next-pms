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
const TimesheetLayout = lazy(() => import("@/pages/timesheet/layout"));
const PersonalTimesheetLayout = lazy(
  () => import("@/pages/timesheet/personal/layout"),
);
const TeamTimesheetLayout = lazy(() => import("@/pages/timesheet/team/layout"));
const TimesheetPersonal = lazy(() => import("@/pages/timesheet/personal"));
const TimesheetTeam = lazy(() => import("@/pages/timesheet/team"));
const TimesheetProject = lazy(() => import("./pages/timesheet/project"));
const AllocationsLayout = lazy(() => import("@/pages/allocations/layout"));
const AllocationsProject = lazy(() => import("@/pages/allocations/project"));
const AllocationsTeam = lazy(() => import("@/pages/allocations/team"));
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
          <Route element={<TimesheetLayout />}>
            <Route
              path={ROUTES["timesheet-project"]}
              element={<TimesheetProject />}
            />
          </Route>
          <Route element={<AllocationsLayout />}>
            <Route
              path={ROUTES["allocations-team"]}
              element={<AllocationsTeam />}
            />
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
