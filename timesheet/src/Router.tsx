import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import Timesheet from "@/pages/Timesheet";
export default function Router() {
  return (
    <>
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="/timesheet" element={<Timesheet />} />
      </Route>
    </>
  );
}
