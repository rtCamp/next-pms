import { FrappeProvider } from "frappe-react-sdk";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { UserProvider } from "@/app/provider/UserProvider";
import Router from "@/Router";
import "./app/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScreenLoader } from "@/app/components/Loader";
import {Suspense} from "react";
function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: "/timesheet",
  });

  return (
    <FrappeProvider url={import.meta.env.VITE_BASE_URL ?? ""}>
      <UserProvider>
        <TooltipProvider>
          <Suspense fallback={<ScreenLoader isFullPage={true} />}>
            <RouterProvider router={router} />
          </Suspense>
        </TooltipProvider>
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
