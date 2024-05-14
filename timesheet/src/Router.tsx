import { Route } from "react-router-dom";

import { ProtectedRoute } from "@/app/lib/ProtectedRoute";
import Timesheet from "@/app/pages/Timesheet/Index";
export default function Router() {
  return (
    <>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Timesheet />} />
      </Route>
    </>
  );
}
