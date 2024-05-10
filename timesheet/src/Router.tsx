import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/app/lib/ProtectedRoute";
import Timesheet from "@/app/pages/Timesheet";
export default function Router() {
  return (
    <>
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="/" element={<Timesheet />} />
      </Route>
    </>
  );
}
