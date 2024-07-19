import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { forwardRef, ReactElement, useContext, useEffect } from "react";
import { setAppLogo, setSidebarCollapsed } from "@/store/user";
import { useDispatch } from "react-redux";
import { Typography } from "@/app/components/typography";
import { NavLink } from "react-router-dom";
import { cn,parseFrappeErrorMsg } from "@/lib/utils";
import { Home, Users, Clock3, ArrowLeftToLine } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { TIMESHEET, HOME, TEAM } from "@/lib/constant";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { useToast } from "@/app/components/ui/use-toast";

export const Sidebar = () => {
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    if (!user.appLogo) {
      fetchAppLogo();
    }
  }, []);

  const fetchAppLogo = () => {
    call
      .get("timesheet_enhancer.api.utils.app_logo")
      .then((res) => {
        dispatch(setAppLogo(res.message));
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  const handleCollapse = () => {
    dispatch(setSidebarCollapsed(!user.isSidebarCollapsed));
  };
  const routes = [
    {
      to: HOME,
      icon: Home,
      label: "Home",
    },
    {
      to: TIMESHEET,
      icon: Clock3,
      label: "Timesheet",
    },
    {
      to: TEAM,
      icon: Users,
      label: "Teams",
    },
  ];
  return (
    <aside
      className={cn(
        "bg-slate-100 h-screen w-1/5 transition-all duration-300 ease-in-out p-4 flex flex-col",
        user.isSidebarCollapsed && "w-16 items-center"
      )}
    >
      <div
        className={cn(
          "flex gap-x-2 items-center",
          !user.isSidebarCollapsed && "pl-3"
        )}
        id="app-logo"
      >
        <img
          src={decodeURIComponent(user.appLogo)}
          alt="app-logo"
          className="w-8 h-8"
        />
        <Typography
          variant="h2"
          className={cn(
            "transition-all duration-300 ease-in-out",
            user.isSidebarCollapsed && "hidden"
          )}
        >
          Timesheet
        </Typography>
      </div>
      <div className="pt-10 flex flex-col gap-y-2">
        {routes.map((route) => {
          return (
            <NavLink
              to={route.to}
              className="transition-all duration-300 ease-in-out flex items-center h-9"
            >
              {({ isActive }: { isActive: boolean }) => (
                <div
                  className={cn(
                    "flex w-full pl-2 rounded-lg items-center px-3 py-2 hover:bg-slate-200 text-primary gap-x-2",
                    isActive &&
                      "bg-primary text-white shadow-md hover:bg-slate-700"
                  )}
                >
                  <route.icon
                    className={cn(
                      "shrink-0 stroke-primary h-4 w-4",
                      isActive && "stroke-background"
                    )}
                  />
                  <Typography
                    variant="p"
                    className={cn(
                      "transition-all duration-300 ease-in-out",
                      user.isSidebarCollapsed && "hidden"
                    )}
                  >
                    {route.label}
                  </Typography>
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
      <div className="grow"></div>
      <Button
        variant="ghost"
        className="justify-start gap-x-2 transition-all duration-300 ease-in-out"
        onClick={handleCollapse}
      >
        <ArrowLeftToLine className="stroke-primary h-4 w-4" />
        <Typography
          variant="p"
          className={cn(
            "transition-all duration-300 ease-in-out",
            user.isSidebarCollapsed && "hidden"
          )}
        >
          Collpase Menu
        </Typography>
      </Button>
    </aside>
  );
};

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: ReactElement }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        "flex items-center rounded-md px-3 py-2 no-underline hover:bg-slate-200 h-9",
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2"> {icon} </span>}
      <Typography variant="p">{title}</Typography>
    </a>
  );
});
