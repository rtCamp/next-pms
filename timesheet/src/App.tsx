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
function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: "/timesheet",
  });

  return (
    <FrappeProvider url={import.meta.env.VITE_BASE_URL ?? ""}>
      <UserProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
