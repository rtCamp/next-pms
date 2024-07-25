import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { TIMESHEET, HOME, TEAM } from "@/lib/constant";

const Timesheet = lazy(() => import("@/app/pages/timesheet"));
const Home = lazy(() => import("@/app/pages/home"));
const Team = lazy(() => import("@/app/pages/team"));
export function Router() {
  return (
    <Routes>
      <Route path={TIMESHEET} element={<Timesheet />} />
      <Route path={HOME} element={<Home />} />
      <Route path={TEAM} element={<Team />} />
    </Routes>
  );
}
