import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Router } from "@/route";
import { Toaster } from "@/app/components/ui/toaster";

export const Layout = () => {
  return (
    <div className="flex flex-row h-screen w-screen">
      <Sidebar />
      <div className="w-full flex flex-col">
        <Header />
        <div className="h-full p-5">
          <Router />
          <Toaster />
        </div>
      </div>
    </div>
  );
};
