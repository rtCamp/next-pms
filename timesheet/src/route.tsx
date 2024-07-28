import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { TIMESHEET, HOME, TEAM } from "@/lib/constant";
import { PmRoute } from "@/app/layout/index";
const Timesheet = lazy(() => import("@/app/pages/timesheet"));
const Home = lazy(() => import("@/app/pages/home"));
const Team = lazy(() => import("@/app/pages/team"));
const EmployeeDetail = lazy(() => import("@/app/pages/team/employeeDetail"));
export function Router() {
  return (
    <Routes>
      <Route path={TIMESHEET} element={<Timesheet />} />
      <Route element={<PmRoute />}>
        <Route path={HOME} element={<Home />} />
        <Route path={TEAM}>
          <Route path={`${TEAM}/`} element={<Team />} />
          <Route path={`${TEAM}/Employee/:id`} element={<EmployeeDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}
