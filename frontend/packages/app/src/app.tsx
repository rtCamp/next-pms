/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Provider } from "react-redux";
import { RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import { ErrorFallback, TooltipProvider } from "@next-pms/design-system/components";
import { FrappeProvider } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */
import { BASE_ROUTE } from "@/lib/constant";
import { UserProvider } from "@/lib/UserProvider";
import { getSiteName, enableSocket } from "@/lib/utils";
import ThemeProvider from "./providers/theme";
import { Router } from "./route";
import { store } from "./store";
const App = () => {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: BASE_ROUTE,
  });

  return (
    <>
      <FrappeProvider
        url={import.meta.env.VITE_BASE_URL ?? ""}
        socketPort={import.meta.env.VITE_SOCKET_PORT}
        enableSocket={enableSocket()}
        siteName={getSiteName()}
      >
        <ThemeProvider>
          <UserProvider>
            <Provider store={store}>
              <TooltipProvider>
                <Suspense fallback={<></>}>
                  <ErrorFallback>
                    <RouterProvider router={router} />
                  </ErrorFallback>
                </Suspense>
              </TooltipProvider>
            </Provider>
          </UserProvider>
        </ThemeProvider>
      </FrappeProvider>
    </>
  );
};

export default App;
