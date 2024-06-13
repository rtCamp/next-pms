import { Route } from "react-router-dom";
import { lazy } from "react";
import { AuthenticatedRoute, OnlyPMRoute } from "@/app/lib/ProtectedRoute";
const Timesheet = lazy(() => import("@/app/pages/Timesheet"));
const  Home   = lazy(() => import("@/app/pages/Home"));
export default function Router() {
  return (
    <>
      <Route element={<AuthenticatedRoute />}>
        <Route path="/" element={<Timesheet />} />
        <Route element={<OnlyPMRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>
      </Route>
    </>
  );
}
