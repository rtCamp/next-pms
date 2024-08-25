import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useContext, useEffect, useState } from "react";
import { setAppLogo, setSidebarCollapsed } from "@/store/user";
import { useDispatch } from "react-redux";
import { Typography } from "@/app/components/typography";
import { NavLink } from "react-router-dom";
import { cn, parseFrappeErrorMsg } from "@/lib/utils";
import { Home, Users, Clock3, ArrowLeftToLine, ArrowRightLeft, LogOut, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { TIMESHEET, HOME, TEAM, DESK } from "@/lib/constant";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { useToast } from "@/app/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { UserContext } from "@/lib/UserProvider";
import { Separator } from "@radix-ui/react-separator";
import GenWrapper from "../components/GenWrapper";

type NestedRoute = {
  to: string;
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
};

type Route = {
  to: string;
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  children?: NestedRoute[];
  isPmRoute: boolean;
};

const Sidebar = () => {
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const [openRoutes, setOpenRoutes] = useState<{ [key: string]: boolean }>({
    reports: false,
  });
  const toggleNestedRoutes = (key: string) => {
    setOpenRoutes((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const hasPmRole = user.roles.includes("Projects Manager");
  const screenSize = useSelector((state: RootState) => state.app.screenSize);
  useEffect(() => {
    if (!user.appLogo) {
      fetchAppLogo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      key: "home",
      isPmRoute: true,
    },
    {
      to: TIMESHEET,
      icon: Clock3,
      label: "Timesheet",
      key: "timesheet",
      isPmRoute: false,
    },
    {
      to: TEAM,
      icon: Users,
      label: "Teams",
      key: "teams",
      isPmRoute: true,
    },
  ];
  useEffect(() => {
    if (screenSize === "sm" || screenSize === "md") {
      dispatch(setSidebarCollapsed(true));
    } else {
      dispatch(setSidebarCollapsed(false));
    }
  }, [screenSize]);
  return (
    <GenWrapper>
      <aside
        className={cn(
          "bg-slate-100  w-1/5 transition-all duration-300 ease-in-out p-4 flex flex-col",
          user.isSidebarCollapsed && "w-16 items-center"
        )}
      >
        <div
          className={cn("flex gap-x-2 items-center overflow-hidden", !user.isSidebarCollapsed && "pl-3")}
          id="app-logo"
        >
          <img
            src={decodeURIComponent(user.appLogo)}
            alt="app-logo"
            className="w-8 h-8 max-xl:w-7 max-xl:h-7 transition-all duration-300 ease-in-out max-lg:w-7 max-lg:h-7 max-md:w-7 max-md:h-7 object-cover"
          />
          <Typography
            variant="h2"
            className={cn(
              "transition-all duration-300 ease-in-out max-md:hidden text-[1.65vw]",
              user.isSidebarCollapsed && "hidden"
            )}
          >
            Timesheet
          </Typography>
        </div>
        <div className="pt-10 flex flex-col gap-y-2 ransition-all duration-300 ease-in-out">
          {routes.map((route: Route) => {
            if (route.isPmRoute && !hasPmRole) return null;

            return route.children ? (
              <div key={route.key}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-x-2 w-full text-left p-2 hover:bg-slate-200 rounded-lg",
                    openRoutes[route.key] && "bg-slate-200 "
                  )}
                  onClick={() => toggleNestedRoutes(route.key)}
                >
                  <route.icon className="w-4 h-4" />
                  <Typography
                    variant="p"
                    className={cn("transition-all duration-300 ease-in-out", user.isSidebarCollapsed && "hidden")}
                  >
                    {route.label}
                  </Typography>
                  {openRoutes[route.key] ? (
                    <ChevronUp className="ml-auto w-4 h-4" />
                  ) : (
                    <ChevronDown className="ml-auto w-4 h-4" />
                  )}
                </Button>
                <div
                  className={cn(
                    "pl-4 pt-2 transition-all duration-300 ease-in-out flex flex-col gap-y-1",
                    openRoutes[route.key] ? "flex" : "hidden"
                  )}
                >
                  {route.children.map((child: NestedRoute) => (
                    <NavLink
                      to={child.to}
                      key={child.key}
                      title={child.label}
                      className="transition-all duration-300 ease-in-out flex items-center h-9"
                    >
                      {({ isActive }) => (
                        <div
                          className={cn(
                            "flex w-full pl-2 rounded-lg items-center px-3 py-2 hover:bg-slate-200 text-primary gap-x-2 overflow-hidden",
                            isActive && "bg-primary shadow-md hover:bg-slate-700 "
                          )}
                        >
                          {child.icon && (
                            <child.icon
                              className={cn("shrink-0 stroke-primary h-4 w-4", isActive && "stroke-background")}
                            />
                          )}
                          <Typography
                            variant="p"
                            className={cn(
                              "transition-all duration-300 ease-in-out text-white",
                              !isActive && "text-primary",
                              user.isSidebarCollapsed && "hidden"
                            )}
                          >
                            {child.label}
                          </Typography>
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                to={route.to}
                key={route.key}
                title={route.label}
                className="transition-all duration-300 ease-in-out flex items-center h-9"
              >
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex w-full pl-2 rounded-lg items-center px-3 py-2 hover:bg-slate-200 text-primary gap-x-2 overflow-hidden",
                      isActive && "bg-primary shadow-md hover:bg-slate-700 "
                    )}
                  >
                    <route.icon className={cn("shrink-0 stroke-primary h-4 w-4", isActive && "stroke-background")} />
                    <Typography
                      variant="p"
                      className={cn(
                        "transition-all duration-300 ease-in-out text-white",
                        !isActive && "text-primary",
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
        <div className={cn("flex justify-between items-center", user.isSidebarCollapsed && "flex-col ")}>
          <Navigation />
          {screenSize !== "sm" && screenSize !== "md" && (
            <Button
              variant="ghost"
              className="justify-end  gap-x-2 transition-all duration-300 ease-in-out h-6"
              onClick={handleCollapse}
            >
              <ArrowLeftToLine
                className={cn(
                  "stroke-primary h-4 w-4 transition-all duration-600",
                  user.isSidebarCollapsed && "rotate-180"
                )}
              />
            </Button>
          )}
        </div>
      </aside>
    </GenWrapper>
  );
};

const Navigation = () => {
  const user = useSelector((state: RootState) => state.user);
  const { logout } = useContext(UserContext);
  return (
    <GenWrapper>
      <Popover>
        <PopoverTrigger className={cn("flex items-center gap-x-2")}>
          <Avatar className="w-8 h-8 justify-self-end transition-all duration-600">
            <AvatarImage src={decodeURIComponent(user.image)} />
            <AvatarFallback>{user.userName[0]}</AvatarFallback>
          </Avatar>
          <Typography
            variant="p"
            className={cn("transition-all duration-800 max-md:hidden", user.isSidebarCollapsed && "hidden")}
          >
            {user.userName}
          </Typography>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col p-1 w-52">
          <a
            className="flex justify-start text-sm hover:no-underline hover:bg-accent p-2 gap-x-2 items-center"
            href={DESK}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Switch To Desk
          </a>
          <Separator className="my-1" />
          <Button
            variant="link"
            className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </PopoverContent>
      </Popover>
    </GenWrapper>
  );
};

export default Sidebar;
