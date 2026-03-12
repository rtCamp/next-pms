/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Provider } from "react-redux";
import { RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import { ErrorFallback, TooltipProvider } from "@next-pms/design-system/components";
import { ToastProvider } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */

import { ROUTES } from "@/lib/constant";
import { UserProvider } from "@/lib/UserProvider";
import FrappeProvider from "./providers/frappe";
import ThemeProvider from "./providers/theme";
import { Router } from "./route";
import { store } from "./store";
const App = () => {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: ROUTES.base,
  });

  return (
    <FrappeProvider>
      <ToastProvider>
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
      </ToastProvider>
    </FrappeProvider>
  );
};

export default App;
