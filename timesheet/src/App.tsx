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
import { Suspense } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/state/store";
import { getSiteName } from "@/app/lib/utils";
function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: "/timesheet",
  });

  return (
    <FrappeProvider
      url={import.meta.env.VITE_BASE_URL ?? ""}
      socketPort={import.meta.env.VITE_SOCKET_PORT}
      enableSocket={import.meta.env.VITE_ENABLE_SOCKET ?? true}
      siteName={getSiteName()}
    >
      <UserProvider>
        <Provider store={store}>
          <TooltipProvider>
            <Suspense fallback={<ScreenLoader isFullPage={true} />}>
              <RouterProvider router={router} />
            </Suspense>
          </TooltipProvider>
        </Provider>
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
