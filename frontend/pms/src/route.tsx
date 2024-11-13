import { lazy, useContext, useEffect } from "react";
import { Route, Outlet } from "react-router-dom";
import { TIMESHEET, HOME, TEAM, TASK, PROJECT } from "@/lib/constant";
import { Layout, PmRoute } from "@/app/layout/index";
import { RootState } from "./store";
import { useDispatch, useSelector } from "react-redux";
import { UserContext } from "@/lib/UserProvider";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { setRole } from "./store/user";
import { setViews } from "./store/view";
import { setCurrency } from "./store/app";
const TimesheetComponent = lazy(() => import("@/app/pages/timesheet"));
const HomeComponent = lazy(() => import("@/app/pages/home"));
const TeamComponent = lazy(() => import("@/app/pages/team"));
const EmployeeDetailComponent = lazy(() => import("@/app/pages/team/employeeDetail"));
const TaskComponent = lazy(() => import("@/app/pages/task"));
const ProjectComponent = lazy(() => import("@/app/pages/project"));
export function Router() {
  return (
    <Route element={<AuthenticatedRoute />}>
      <Route path={TIMESHEET} element={<TimesheetComponent />} />
      <Route element={<PmRoute />}>
        <Route path={HOME} element={<HomeComponent />} />
        <Route path={TEAM}>
          <Route path={`${TEAM}/`} element={<TeamComponent />} />
          <Route path={`${TEAM}/employee/:id?`} element={<EmployeeDetailComponent />} />
        </Route>
        <Route path={`${PROJECT}/:type?`} element={<ProjectComponent />} />
      </Route>
      <Route path={TASK} element={<TaskComponent />} />
    </Route>
  );
}

export const AuthenticatedRoute = () => {
  const { currentUser, isLoading } = useContext(UserContext);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const user = useSelector((state: RootState) => state.user);
  const views = useSelector((state: RootState) => state.view);
  const dispatch = useDispatch();
  useEffect(() => {
    if (user.roles.length < 1) {
      call.get("next_pms.timesheet.api.app.get_app_data").then((res) => {
        dispatch(setRole(res.message.roles));
        dispatch(setCurrency(res.message.currencies));
      });
    }
    if (views.views.length < 1) {
      call.get("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_views").then((res) => {
        dispatch(setViews(res.message));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
