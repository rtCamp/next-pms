/**
 * External dependencies.
 */
import { Suspense } from "react";
import { Provider } from "react-redux";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import {
  ErrorFallback,
  TooltipProvider,
} from "@next-pms/design-system/components";
import { ToastProvider } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */

import { ROUTES } from "@/lib/constant";
import { NotificationsProvider } from "@/providers/notifications/provider";
import { UserProvider } from "@/providers/user/provider";
import FrappeProvider from "./providers/frappe";
import ThemeProvider from "./providers/theme";
import { Router } from "./route";
import { store } from "./store";
const App = () => {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: ROUTES.base,
  });

  return (
    <ErrorFallback>
      <ToastProvider>
        <FrappeProvider>
          <ThemeProvider>
            <UserProvider>
              <NotificationsProvider>
                <Provider store={store}>
                  <TooltipProvider>
                    <Suspense fallback={<></>}>
                      <ErrorFallback>
                        <RouterProvider router={router} />
                      </ErrorFallback>
                    </Suspense>
                  </TooltipProvider>
                </Provider>
              </NotificationsProvider>
            </UserProvider>
          </ThemeProvider>
        </FrappeProvider>
      </ToastProvider>
    </ErrorFallback>
  );
};

export default App;
