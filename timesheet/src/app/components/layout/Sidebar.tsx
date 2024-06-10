import { Icon } from "../Icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "react-router-dom";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";

export function Sidebar() {
  const roles = useSelector((state: RootState) => state.roles);
  const hasPmRole = roles.value.includes("Projects Manager");
  return (
    <div className="border-[1px] border-borderLine h-[650px]">
      <div className=" p-2.5">
        {hasPmRole && (
          <NavLink to="/home">
            {({ isActive }) => (
              <Button
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-x-1.5"
              >
                <Icon name="home" stroke={isActive ? "#fff" : "#1C1C1C"} />
                <p className="font-semibold">Home</p>
              </Button>
            )}
          </NavLink>
        )}
        <NavLink to="/">
          {({ isActive }) => (
            <Button
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start gap-x-1.5"
            >
              <Icon name="clock" stroke={isActive ? "#fff" : "#1C1C1C"} />
              <p className="font-semibold">Timesheet</p>
            </Button>
          )}
        </NavLink>
        {hasPmRole && (
          <NavLink to="/projects">
            {({ isActive }) => (
              <Button
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-x-1.5"
              >
                <Icon name="briefcase" stroke={isActive ? "#fff" : "#1C1C1C"} />
                <p className="font-semibold">Projects</p>
              </Button>
            )}
          </NavLink>
        )}
        <Separator className="my-2 borderLine" />
        <NavLink to="/setting">
          {({ isActive }) => (
            <Button
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start gap-x-1.5"
            >
              <Icon name="setting" stroke={isActive ? "#fff" : ""} />
              <p className="font-semibold">Settings</p>
            </Button>
          )}
        </NavLink>
      </div>
    </div>
  );
}
