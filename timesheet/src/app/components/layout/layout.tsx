import React from "react";
import { Header } from "@/app/components/layout/Header";
import { AppDispatch } from "@/app/state/store";
import {  useDispatch } from "react-redux";
import { fetchEmployee } from "@/app/state/employee";
import { Toaster } from "@/components/ui/toaster"

export function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  dispatch(fetchEmployee());
  return (
    <div>
      <Header />
      <div className="lg:max-w-screen-lg lg:mr-auto lg:ml-auto md:pr-5 md:pl-5 pl-2 pr-3 xl:pr-0 xl:pl-0 pt-4">
        {children}
      </div>
      <Toaster />
    </div>
  );
}
