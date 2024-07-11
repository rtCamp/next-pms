import { FrappeProvider } from "frappe-react-sdk";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { UserProvider } from "@/app/provider/UserProvider";
import Router from "@/Router";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      enableSocket={
        import.meta.env.VITE_ENABLE_SOCKET === "true" ? true : false
      }
      siteName={getSiteName()}
    >
      {/* Provides user Auth functions. */}
      <UserProvider>
        {/* Redux store. */}
        <Provider store={store}>
          <TooltipProvider>
            {/* Within routes component  are lazy loaded, therefore suspense is required. */}
            <Suspense fallback={<></>}>
              <RouterProvider router={router} />
            </Suspense>
          </TooltipProvider>
        </Provider>
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
