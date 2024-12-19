/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Provider } from "react-redux";
import { RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import { FrappeProvider } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { BASE_ROUTE } from "@/lib/constant";
import { UserProvider } from "@/lib/UserProvider";
import { getSiteName } from "@/lib/utils";
import { Router } from "@/route";
import { store } from "@/store";
import GenWrapper from "./app/components/GenWrapper";

function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: BASE_ROUTE,
  });

  return (
    <>
      <FrappeProvider
        url={import.meta.env.VITE_BASE_URL ?? ""}
        socketPort={import.meta.env.VITE_SOCKET_PORT}
        enableSocket={import.meta.env.VITE_ENABLE_SOCKET === "true" ? true : false}
        siteName={getSiteName()}
      >
        <UserProvider>
          <Provider store={store}>
            <TooltipProvider>
              <Suspense fallback={<></>}>
                <GenWrapper>
                  <RouterProvider router={router} />
                </GenWrapper>
              </Suspense>
            </TooltipProvider>
          </Provider>
        </UserProvider>
      </FrappeProvider>
    </>
  );
}

export default App;
