import { cn } from "@/lib/utils";
import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Header = ({ children, className }: Props) => {
  return (
    <div className="flex border-b">
      <header className={cn("flex h-14 items-center justify-between px-3 py-2 w-full", className)}>
        <div className="w-full">{children}</div>
      </header>
    </div>
  );
};

export const Footer = ({ children }: Props) => {
  return (
    <footer className="flex border-t h-14 items-center justify-between px-3 py-2 w-full sticky bottom-0">
      <div className="w-full">{children}</div>
    </footer>
  );
};

export const Main = ({ children, className }: Props) => {
  return (
    <div className="overflow-hidden w-full">
      <div className={cn("px-3 flex flex-col h-screen w-full", className)}>
        <div className="overflow-auto  w-full">{children}</div>
      </div>
    </div>
  );
};
