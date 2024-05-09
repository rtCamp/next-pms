import { FrappeProvider } from "frappe-react-sdk";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { UserProvider } from "@/provider/UserProvider";
import Router from "@/Router";
import { Header } from "@/components/timesheet/Header";
import "../app/globals.css";
function App() {
  const router = createBrowserRouter(createRoutesFromElements(Router()),{ basename: '/timesheet' });
  return (
    <FrappeProvider url={import.meta.env.VITE_ASE_URL ?? ""}>
      <UserProvider>
        <Header />
        <RouterProvider router={router} />
      </UserProvider>
    </FrappeProvider>
  );
}

export default App;
