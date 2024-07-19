import { lazy } from "react";
import { Routes, Route } from "react-router-dom";

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<>test</>} />
    </Routes>
  );
}
