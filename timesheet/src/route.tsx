import { lazy } from "react";
import { Routes, Route } from "react-router-dom";

const Timesheet = lazy(() => import("@/app/pages/timesheet"));

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Timesheet/>} />
    </Routes>
  );
}
