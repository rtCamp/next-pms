import { getSiteName } from "@/lib/utils";
import { FrappeProvider } from "frappe-react-sdk";
import { UserProvider } from "@/lib/UserProvider";
import { Provider } from "react-redux";
import { store } from "@/store";
import { Layout } from "@/app/layout";
import { BrowserRouter } from "react-router-dom";
import { BASE_ROUTE } from "@/lib/constant";
import { TooltipProvider } from "@/app/components/ui/tooltip";
function App() {
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
            <BrowserRouter basename={BASE_ROUTE}>
              <TooltipProvider>
                <Layout />
              </TooltipProvider>
            </BrowserRouter>
          </Provider>
        </UserProvider>
      </FrappeProvider>
    </>
  );
}

export default App;
