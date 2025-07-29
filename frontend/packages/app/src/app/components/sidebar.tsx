/**
 * External dependencies
 */
import React, { useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { mergeClassNames } from "@/lib/utils";

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ children, className, drawerOpen, setDrawerOpen }) => {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileDrawer className={className} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        {children}
      </MobileDrawer>
    </>
  );
};

const DesktopSidebar = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <aside
      className={mergeClassNames(
        "hidden md:flex min-w-sm h-full lg:max-w-72 max-lg:max-w-60 w-full bg-background border-l border-border flex-col gap-4",
        className
      )}
      style={{ position: "relative" }}
    >
      {children}
    </aside>
  );
};

const MobileDrawer = ({
  children,
  className,
  drawerOpen,
  setDrawerOpen,
}: {
  children: React.ReactNode;
  className?: string;
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
}) => {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handler = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen?.(false);
    };

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [setDrawerOpen]);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTitle className="sr-only">Sidebar</SheetTitle>
      <SheetContent side="right" className="max-w-sm px-0">
        <div className={mergeClassNames("flex flex-col gap-2 h-full overflow-y-auto mt-2", className)}>{children}</div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
