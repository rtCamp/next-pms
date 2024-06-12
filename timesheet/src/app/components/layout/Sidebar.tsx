import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "react-router-dom";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { Home, Clock, Briefcase, Setting } from "../Icon";
export function Sidebar() {
  const roles = useSelector((state: RootState) => state.roles);
  const hasPmRole = roles.value.includes("Projects Manager");
  const routes = [
    {
      to: "/home",
      icon: Home,
      label: "Home",
      isPmRoute: true,
      isSeparator: false,
    },
    {
      to: "/",
      icon: Clock,
      label: "Timesheet",
      isPmRoute: false,
      isSeparator: false,
    },
    {
      to: "/projects",
      icon: Briefcase,
      label: "Projects",
      isPmRoute: true,
      isSeparator: false,
    },
    {
      to: "",
      icon: "",
      label: "",
      isPmRoute: false,
      isSeparator: true,
    },
    {
      to: "/setting",
      icon: Setting,
      label: "Settings",
      isPmRoute: false,
      isSeparator: false,
    },
  ];
  return (
    <div className="border-[1px]  h-[650px]">
      <div className=" p-2.5">
        {routes.map((route) => {
          if (route.isSeparator)
            return <Separator className="my-2 borderLine" />;
          if (route.isPmRoute && !hasPmRole) return null;
          return (
            <NavLink to={route.to}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-x-1.5"
                >
                  <route.icon stroke={isActive ? "#FFF" : "#1c1c1c"} />
                  <p className="font-semibold">{route.label}</p>
                </Button>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
