import { useState } from "react";
import { FrappeProvider } from "frappe-react-sdk";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { UserProvider } from "@/provider/UserProvider";
import Router from "@/Router";

import "./App.css";
function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()));
  return (
    <FrappeProvider url="http://careers.localhost">
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
