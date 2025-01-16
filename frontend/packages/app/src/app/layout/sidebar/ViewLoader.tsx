/**
 * External dependencies.
 */

import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Typography } from "@/app/components/typography";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/lib/utils";
import { ViewData } from "@/store/view";

const ViewLoader = ({
  isSidebarCollapsed,
  openRoutes,
  views,
  label,
  onClick,
  hasPmRole,
  id,
}: {
  hasPmRole: boolean;
  label: string;
  id: string;
  isSidebarCollapsed: boolean;
  openRoutes: {
    [key: string]: boolean;
  };
  views: ViewData[];
  onClick: () => void;
}) => {
  if (!hasPmRole || views.length == 0) return null;
  return (
    <>
      <Separator className="my-1" />
      {!isSidebarCollapsed && (
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-x-2 w-full text-left p-2 hover:bg-slate-200 rounded-lg justify-between",
            openRoutes[id] && "bg-slate-200 "
          )}
          onClick={onClick}
        >
          <span className="flex items-center gap-x-2">
            {openRoutes[id] ? <ChevronUp /> : <ChevronDown />}
            <Typography
              variant="p"
              className={cn("transition-all duration-300 ease-in-out ", isSidebarCollapsed && "hidden")}
            >
              {label}
            </Typography>
          </span>
        </Button>
      )}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out flex flex-col gap-y-1",
          !isSidebarCollapsed && openRoutes[id] ? "flex" : "hidden",
          isSidebarCollapsed && "flex"
        )}
      >
        {views.map((view: ViewData) => {
          const isActive = view.route === window.location.pathname;
          return (
            <NavLink
              to={`${view.route}?view=${view.name}`}
              key={view.name}
              title={view.label}
              className="transition-all duration-300 ease-in-out flex items-center h-9"
            >
              <div
                className={cn(
                  "flex w-full mt-2 rounded-lg items-center p-2 hover:bg-slate-200 text-primary gap-x-2 ",
                  isActive && "bg-primary shadow-md hover:bg-slate-700 "
                )}
              >
                <span>{view.icon}</span>
                <Typography
                  variant="p"
                  className={cn(
                    "transition-all duration-300 truncate ease-in-out text-white",
                    !isActive && "text-primary",
                    isSidebarCollapsed && "hidden"
                  )}
                >
                  {view.label}
                </Typography>
              </div>
            </NavLink>
          );
        })}
      </div>
    </>
  );
};

export default ViewLoader;