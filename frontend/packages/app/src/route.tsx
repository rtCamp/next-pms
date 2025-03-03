/**
 * External dependencies.
 */
import { lazy, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Outlet, Navigate } from "react-router-dom";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { TIMESHEET, HOME, TEAM, TASK, PROJECT, RESOURCE_MANAGEMENT, ROLES } from "@/lib/constant";
import { UserContext } from "@/lib/UserProvider";
import { default as Layout } from "./app/layout";
import { RootState } from "./store";
import { setCurrency } from "./store/user";
import { setRole } from "./store/user";
import { setViews } from "./store/view";
/**
 * Lazy load components.
 */
const TimesheetComponent = lazy(() => import("@/app/pages/timesheet"));
const HomeComponent = lazy(() => import("@/app/pages/home"));
const TeamComponent = lazy(() => import("@/app/pages/team"));
const ResourceTeamComponent = lazy(() => import("@/app/pages/resource_management/team"));
const ResourceProjectComponent = lazy(() => import("@/app/pages/resource_management/project"));
const ResourceTimeLineComponet = lazy(() => import("@/app/pages/resource_management/timeline"));
const EmployeeDetailComponent = lazy(() => import("@/app/pages/team/employee-detail"));
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
        <Route path={`${RESOURCE_MANAGEMENT}/timeline`} element={<ResourceTimeLineComponet />} />
        <Route path={`${RESOURCE_MANAGEMENT}/team`} element={<ResourceTeamComponent />} />
        <Route path={`${RESOURCE_MANAGEMENT}/project`} element={<ResourceProjectComponent />} />
      </Route>
      <Route path={TASK} element={<TaskComponent />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

const AuthenticatedRoute = () => {
  const { currentUser, isLoading } = useContext(UserContext);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const user = useSelector((state: RootState) => state.user);
  const views = useSelector((state: RootState) => state.view);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user.roles.length < 1) {
      call.get("next_pms.timesheet.api.app.get_data").then((res) => {
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

const PmRoute = () => {
  const user = useSelector((state: RootState) => state.user);
  const hasAccess = user.roles.some((role: string) => ROLES.includes(role));

  if (!hasAccess) {
    return <Navigate to={TIMESHEET} />;
  }

  return <Outlet />;
};
