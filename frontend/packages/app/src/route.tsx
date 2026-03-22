/**
 * External dependencies.
 */
import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { useUser } from "./providers/user";
/**
 * Lazy load components.
 */
const Home = lazy(() => import("@/pages/home"));
const Task = lazy(() => import("@/pages/task"));
const Project = lazy(() => import("@/pages/project"));
const TimesheetLayout = lazy(() => import("@/pages/timesheet/layout"));
const TimesheetPersonal = lazy(() => import("@/pages/timesheet/personal"));
const TimesheetTeam = lazy(() => import("@/pages/timesheet/team"));
const TimesheetProject = lazy(() => import("./pages/timesheet/project"));
const Allocation = lazy(() => import("@/pages/allocation"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const Report = lazy(() => import("@/pages/report"));
const NotFound = lazy(() => import("@/pages/404"));

export function Router() {
  return (
    <Route>
      <Route element={<AuthenticatedRoute />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.task} element={<Task />} />
        <Route path={ROUTES.project} element={<Project />} />
        <Route element={<TimesheetLayout />}>
          <Route
            path={ROUTES["timesheet-personal"]}
            element={<TimesheetPersonal />}
          />
          <Route path={ROUTES["timesheet-team"]} element={<TimesheetTeam />} />
          <Route
            path={ROUTES["timesheet-project"]}
            element={<TimesheetProject />}
          />
        </Route>
        <Route path={ROUTES.allocation} element={<Allocation />} />
        <Route path={ROUTES.roadmap} element={<Roadmap />} />
        <Route path={ROUTES.report} element={<Report />} />
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
