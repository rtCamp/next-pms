import { lazy, useContext, useEffect } from "react";
import { TIMESHEET, HOME, TEAM, TASK, PROJECT, RESOURCE_MANAGEMENT } from "@/lib/constant";
import { Route, Outlet, Navigate } from "react-router-dom";
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
const TeamResourceComponent = lazy(() => import("@/app/pages/resource_management/team"));
const ProjectResourceComponent = lazy(() => import("@/app/pages/resource_management/project"));
const EmployeeDetailComponent = lazy(() => import("@/app/pages/team/employeeDetail"));
const TaskComponent = lazy(() => import("@/app/pages/task"));
const ProjectComponent = lazy(() => import("@/app/pages/project"));
const NotFound = lazy(() => import("@/app/pages/404"));
export function Router() {
  return (
    <Route>
      <Route element={<AuthenticatedRoute />}>
        <Route path="/" element={<Navigate to={TIMESHEET} replace />} />
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
        <Route path={RESOURCE_MANAGEMENT}>
          <Route path={`${RESOURCE_MANAGEMENT}/`} element={<TeamResourceComponent />} />
        </Route>
      </Route>
      <Route path={TASK} element={<TaskComponent />} />
      <Route path="*" element={<NotFound />} />
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
