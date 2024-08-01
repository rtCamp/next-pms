import { lazy, useContext } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { TIMESHEET, HOME, TEAM } from "@/lib/constant";
import { PmRoute } from "@/app/layout/index";
import { RootState } from "./store";
import { useSelector } from "react-redux";
import { UserContext } from "@/lib/UserProvider";
import { Spinner } from "./app/components/spinner";
const Timesheet = lazy(() => import("@/app/pages/timesheet"));
const Home = lazy(() => import("@/app/pages/home"));
const Team = lazy(() => import("@/app/pages/team"));
const EmployeeDetail = lazy(() => import("@/app/pages/team/employeeDetail"));
export function Router() {
  return (
    <Routes>
      <Route element={<AuthorizeRoute />}>
        <Route path={TIMESHEET} element={<Timesheet />} />
        <Route element={<PmRoute />}>
          <Route path={HOME} element={<Home />} />
          <Route path={TEAM}>
            <Route path={`${TEAM}/`} element={<Team />} />
            <Route path={`${TEAM}/Employee/:id`} element={<EmployeeDetail />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

const AuthorizeRoute = () => {
  const user = useSelector((state: RootState) => state.user);
  const { currentUser, isLoading } = useContext(UserContext);
  if (isLoading) {
    return <Spinner />;
  }
  if (user.roles.length < 1 || !currentUser || currentUser === "Guest") {
    window.location.replace("/login?redirect-to=/timesheet");
  }
  return <Outlet />;
};
