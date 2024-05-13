import { FrappeProvider } from "frappe-react-sdk";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { UserProvider } from "@/app/provider/UserProvider";
import Router from "@/Router";
import { Header } from "@/app/components/layout/Header";
import "./app/globals.css";

function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()), {
    basename: "/timesheet",
  });

  return (
    <FrappeProvider url={import.meta.env.VITE_BASE_URL ?? ""}>
      <UserProvider>
        <Header />
        <div className="lg:max-w-screen-lg lg:mr-auto lg:ml-auto md:pr-5 md:pl-5 pl-2 pr-3 xl:pr-0 xl:pl-0 pt-4">
          <RouterProvider router={router} />
        </div>
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
