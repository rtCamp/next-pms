/**
 * External dependencies.
 */
import { lazy, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Outlet } from "react-router-dom";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { useContextSelector } from "use-context-selector";
/**
 * Internal dependencies.
 */
import { TIMESHEET } from "@/lib/constant";
import { UserContext } from "@/lib/UserProvider";
import { default as Layout } from "@/layout";
import { RootState } from "./store";
import { setCurrency, setHasBuField, setHasIndustryField } from "./store/user";
import { setRole } from "./store/user";
import { setViews } from "./store/view";
/**
 * Lazy load components.
 */
const TimesheetLayout = lazy(() => import("@/pages/timesheet/layout"));
const TimesheetPersonal = lazy(() => import("@/pages/timesheet/personal"));
const TimesheetTeam = lazy(() => import("@/pages/timesheet/team"));
const TimesheetProject = lazy(() => import("./pages/timesheet/project"));
const Home = lazy(() => import("@/pages/home"));
const Task = lazy(() => import("@/pages/task"));
const Project = lazy(() => import("@/pages/project"));
const NotFound = lazy(() => import("@/pages/404"));

export function Router() {
  return (
    <Route>
      <Route element={<AuthenticatedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Task />} />
        <Route path="/project" element={<Project />} />
        <Route element={<TimesheetLayout />}>
          <Route path={TIMESHEET + "/personal"} element={<TimesheetPersonal />} />
          <Route path={TIMESHEET + "/team"} element={<TimesheetTeam />} />
          <Route path={TIMESHEET + "/project"} element={<TimesheetProject />} />
        </Route>
        <Route path="/allocation" element={<Project />} />
        <Route path="/roadmap" element={<Project />} />
        <Route path="/report" element={<Project />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

const AuthenticatedRoute = () => {
  const { currentUser, isLoading } = useContextSelector(UserContext, (value) => value.state);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const user = useSelector((state: RootState) => state.user);
  const views = useSelector((state: RootState) => state.view);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user.roles.length < 1) {
      call.get("next_pms.timesheet.api.app.get_data").then((res) => {
        dispatch(setRole(res.message.roles));
        dispatch(setCurrency(res.message.currencies));
        dispatch(setHasBuField(res.message.has_business_unit));
        dispatch(setHasIndustryField(res.message.has_industry));
      });
    }
    if (views.views.length < 1) {
      call.get("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_views").then((res) => {
        dispatch(setViews(res.message));
      });
    }
  }, [call, dispatch, user.roles.length, views.views.length]);

  if (isLoading) {
    return <></>;
  } else if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/next-pms/timesheet");
  }

  if (!isLoading && currentUser && currentUser !== "Guest") {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }
};