/**
 * External dependencies.
 */
import { lazy, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Outlet } from "react-router-dom";
/**
 * Internal dependencies.
 */
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { default as Layout } from "@/layout";
import { ROUTES } from "@/lib/constant";
import { setViews } from "@/store/view";
import { useUserState } from "./providers/user";
import { RootState } from "./store";
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
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const { isLoading: isUserLoading, currentUser } = useUserState();
  const views = useSelector((state: RootState) => state.view);
  const dispatch = useDispatch();

  useEffect(() => {
    if (views.views.length < 1) {
      call
        .get(
          "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_views",
        )
        .then((res) => {
          dispatch(setViews(res.message));
        });
    }
  }, [call, dispatch, views.views.length]);

  if (isUserLoading) {
    return <></>;
  } else if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/next-pms/timesheet");
  }

  if (!isUserLoading && currentUser && currentUser !== "Guest") {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }
};
