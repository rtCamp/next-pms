import { lazy, useContext } from "react";
import { Route, Outlet } from "react-router-dom";
import { TIMESHEET, HOME, TEAM,TASK } from "@/lib/constant";
import { Layout, PmRoute } from "@/app/layout/index";
import { RootState } from "./store";
import { useDispatch, useSelector } from "react-redux";
import { UserContext } from "@/lib/UserProvider";

import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import { setRole } from "./store/user";
const Timesheet = lazy(() => import("@/app/pages/timesheet"));
const Home = lazy(() => import("@/app/pages/home"));
const Team = lazy(() => import("@/app/pages/team"));
const EmployeeDetail = lazy(() => import("@/app/pages/team/employeeDetail"));
const Task = lazy(() => import("@/app/pages/task"));
export function Router() {
  return (
    <Route element={<AuthenticatedRoute />}>
      <Route path={TIMESHEET} element={<Timesheet />} />
      <Route element={<PmRoute />}>
        <Route path={HOME} element={<Home />} />
        <Route path={TEAM}>
          <Route path={`${TEAM}/`} element={<Team />} />
          <Route path={`${TEAM}/employee/:id`} element={<EmployeeDetail />} />
        </Route>
      </Route>
      <Route path={TASK} element={<Task />} />
    </Route>
  );
}

export const AuthenticatedRoute = () => {
  const { currentUser, isLoading } = useContext(UserContext);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  if (user.roles.length < 1) {
    call.get("timesheet_enhancer.api.utils.get_current_user_roles").then((res) => {
      dispatch(setRole(res.message));
    });
  }
  if (isLoading) {
    return <></>;
  } else if (!currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/timesheet");
  }
  if (!isLoading && currentUser && currentUser !== "Guest") {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }
};
