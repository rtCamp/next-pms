import { lazy } from "react";
import { Routes, Route } from "react-router-dom";

const Timesheet = lazy(() => import("@/app/pages/timesheet"));
const Home = lazy(() => import("@/app/pages/home"));
export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Timesheet />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}
