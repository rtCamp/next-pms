import { cn } from "@/lib/utils";
import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  parentClassName?: string;
}

export const Header = ({ children, className, parentClassName }: Props) => {
  return (
    <div className={cn("flex border-b", parentClassName)}>
      <header className={cn("flex h-14 max-md:h-fit items-center justify-between px-3 py-2 w-full", className)}>
        {children}
      </header>
    </div>
  );
};

export const Footer = ({ children }: Props) => {
  return (
    <footer className="flex border-t h-14 max-md:h-fit items-center justify-between px-3 py-2 w-full mt-auto">
      <div className="w-full">{children}</div>
    </footer>
  );
};

export const Main = ({ children, className }: Props) => {
  return (
    <div className="overflow-auto h-full w-full">
      <div className={cn("px-3 flex flex-col", className)}>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};
