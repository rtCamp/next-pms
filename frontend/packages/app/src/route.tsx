/**
 * External dependencies.
 */
import { lazy, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Outlet, Navigate } from "react-router-dom";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { useContextSelector } from "use-context-selector";
/**
 * Internal dependencies.
 */
import { TIMESHEET, HOME, TEAM, TASK, PROJECT, RESOURCE_MANAGEMENT, ROLES } from "@/lib/constant";
import { UserContext } from "@/lib/UserProvider";
import { default as Layout } from "@/layout";
import { RootState } from "./store";
import { setCurrency, setHasBuField, setHasIndustryField } from "./store/user";
import { setRole } from "./store/user";
import { setViews } from "./store/view";
/**
 * Lazy load components.
 */
const TimesheetLayout = lazy(()=>import("@/pages/timesheet/layout"));
const TimesheetPersonal = lazy(() => import("@/pages/timesheet/personal"));
const TimesheetTeam = lazy(() => import("@/pages/timesheet/team"));
const TimesheetProject = lazy(() => import("./pages/timesheet/project"));
const Home = lazy(() => import("@/pages/home"));
const Team = lazy(() => import("@/pages/team"));
const ResourceTeam = lazy(() => import("@/pages/resource-management/team"));
const ResourceProject = lazy(() => import("@/pages/resource-management/project"));
const ResourceTimeLine = lazy(() => import("@/pages/resource-management/timeline"));
const EmployeeDetail = lazy(() => import("@/pages/team/employee-detail"));
const Task = lazy(() => import("@/pages/task"));
const Project = lazy(() => import("@/pages/project"));
const ProjectDetail = lazy(() => import("@/pages/project/project-detail"));
const NotFound = lazy(() => import("@/pages/404"));

export function Router() {
  return (
    <Route>
      <Route element={<AuthenticatedRoute />}>
        <Route path="/" element={<Navigate to={TIMESHEET} replace />} />
        <Route element={<TimesheetLayout />} >
            <Route path={TIMESHEET + "/personal"} element={<TimesheetPersonal />} />
            <Route path={TIMESHEET + "/team"} element={<TimesheetTeam />} />
            <Route path={TIMESHEET + "/project"} element={<TimesheetProject />} />
        </Route>



        <Route element={<PmRoute />}>
          <Route path={HOME} element={<Home />} />
          <Route path={TEAM}>
            <Route path={`${TEAM}/`} element={<Team />} />
            <Route path={`${TEAM}/employee/:id?`} element={<EmployeeDetail />} />
          </Route>
          <Route path={PROJECT}>
            <Route path={`${PROJECT}/`} element={<Project />} />
            <Route path={`${PROJECT}/:projectId`} element={<ProjectDetail />} />
          </Route>
        </Route>
        <Route path={TASK} element={<Task />} />
        <Route path={`${RESOURCE_MANAGEMENT}/timeline`} element={<ResourceTimeLine />} />
        <Route path={`${RESOURCE_MANAGEMENT}/team`} element={<ResourceTeam />} />
        <Route path={`${RESOURCE_MANAGEMENT}/project`} element={<ResourceProject />} />
      </Route>
      <Route path={TASK} element={<Task />} />
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

const PmRoute = () => {
  const user = useSelector((state: RootState) => state.user);
  const hasAccess = user.roles.some((role: string) => ROLES.includes(role));

  if (!hasAccess) {
    return <Navigate to={TIMESHEET} />;
  }

  return <Outlet />;
};
