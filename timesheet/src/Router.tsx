import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/app/lib/ProtectedRoute";
const Timesheet = lazy(() => import("@/app/pages/Timesheet/Index"));
export default function Router() {
  return (
    <>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Timesheet />} />
      </Route>
    </>
  );
}
