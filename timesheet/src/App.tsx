import { useState } from "react";
import { FrappeProvider } from "frappe-react-sdk";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { UserProvider } from "@/provider/UserProvider";
import Router from "@/Router";

import "../app/globals.css";
function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()));
  return (
    <FrappeProvider url={import.meta.env.VITE_BASE_URL ?? ""} >
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
