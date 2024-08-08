import { getSiteName } from "@/lib/utils";
import { FrappeProvider } from "frappe-react-sdk";
import { UserProvider } from "@/lib/UserProvider";
import { Provider } from "react-redux";
import { store } from "@/store";
import { RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import { BASE_ROUTE } from "@/lib/constant";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { Router } from "@/route";
import { Suspense } from "react";
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
                <RouterProvider router={router} />
              </Suspense>
            </TooltipProvider>
          </Provider>
        </UserProvider>
      </FrappeProvider>
    </>
  );
}

export default App;
