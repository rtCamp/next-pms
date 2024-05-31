import { Route } from "react-router-dom";
import { lazy } from "react";
import { AuthenticatedRoute, OnlyPMRoute } from "@/app/lib/ProtectedRoute";
const Timesheet = lazy(() => import("@/app/pages/Timesheet"));
const CompactView = lazy(() => import("@/app/pages/Team/CompactView"));
const TeamView = lazy(() => import("@/app/pages/Team"));
export default function Router() {
  return (
    <>
      <Route element={<AuthenticatedRoute />}>
        <Route path="/" element={<Timesheet />} />
        <Route element={<OnlyPMRoute />}>
          <Route path="/teams" element={<TeamView />} />
          <Route path="/teams/compact" element={<CompactView />} />
        </Route>
      </Route>
    </>
  );
}
