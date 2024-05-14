import React from "react";
import { Header } from "@/app/components/layout/Header";
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <div className="lg:max-w-screen-lg lg:mr-auto lg:ml-auto md:pr-5 md:pl-5 pl-2 pr-3 xl:pr-0 xl:pl-0 pt-4">
        {children}
      </div>
    </div>
  );
}
