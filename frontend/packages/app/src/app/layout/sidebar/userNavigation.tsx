/**
 * External dependencies.
 */
import { useState } from "react";
import {
  ErrorFallback,
  Typography,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Spinner,
} from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ArrowRightLeft, LogOut, Sun, Moon, LayoutGrid, ArrowRightToLine } from "lucide-react";
import { useContextSelector } from "use-context-selector";
/**
 * Internal dependencies.
 */
import { DESK } from "@/lib/constant";
import { UserContext } from "@/lib/UserProvider";
import { mergeClassNames } from "@/lib/utils";
import { useTheme } from "@/providers/theme/hook";
import type { UserNavigationProps } from "./types";

const UserNavigation = ({ user }: UserNavigationProps) => {
  const logout = useContextSelector(UserContext, (value) => value.actions.logout);
  const { theme, isDarkThemeOnSystem, setTheme } = useTheme();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const changeTheme = () => {
    if (theme === "system") {
      setTheme(isDarkThemeOnSystem ? "light" : "dark");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  return (
    <ErrorFallback>
      <Popover onOpenChange={() => setShowSwitcher(false)}>
        <PopoverTrigger title={user.userName} className={mergeClassNames("flex items-center gap-x-2 truncate")}>
          <Avatar className="w-8 h-8 justify-self-end transition-all duration-600">
            <AvatarImage src={decodeURIComponent(user.image)} />
            <AvatarFallback>{user.userName[0]}</AvatarFallback>
          </Avatar>
          <Typography
            variant="p"
            className={mergeClassNames(
              "transition-all duration-800 max-md:hidden overflow-hidden max-w-full max-lg:1/3 truncate",
              user.isSidebarCollapsed && "hidden"
            )}
          >
            {user.userName}
          </Typography>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col p-1 w-52 z-[1000]">
          <HoverCard open={showSwitcher}>
            <HoverCardTrigger asChild>
              <Button
                variant="link"
                className="flex justify-between hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={() => setShowSwitcher((prev) => !prev)}
              >
                <span className="flex gap-x-2 items-center">
                  <LayoutGrid /> Apps
                </span>
                <ArrowRightToLine />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-1" side="right">
              <AppSwitcher />
            </HoverCardContent>
          </HoverCard>
          <Separator className="my-1" />
          <a
            className="flex justify-start rounded text-sm hover:no-underline hover:bg-accent p-2 gap-x-2 items-center"
            href={DESK}
          >
            <ArrowRightLeft />
            Switch To Desk
          </a>
          <Separator className="my-1" />
          <Button
            variant="link"
            className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={changeTheme}
          >
            {theme === "system" ? (
              <>{isDarkThemeOnSystem ? <Sun /> : <Moon />}</>
            ) : (
              <>{theme === "light" ? <Moon /> : <Sun />}</>
            )}
            Toggle theme
          </Button>
          <Separator className="my-1" />
          <Button
            variant="link"
            className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={logout}
          >
            <LogOut />
            Logout
          </Button>
        </PopoverContent>
      </Popover>
    </ErrorFallback>
  );
};

const AppSwitcher = () => {
  const { data, isLoading } = useFrappeGetCall("frappe.apps.get_apps", {}, undefined, {
    revalidateIfStale: false,
  });
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-1">
      {data?.message?.map((app: { name: string; logo: string; route: string; title: string }) => {
        if (app.name === "next_pms") return;
        return (
          <a
            key={app.name}
            href={app.route}
            className="flex flex-col items-center justify-start gap-y-1 hover:no-underline hover:bg-accent p-1  rounded"
          >
            <img src={app.logo} alt={app.title} className="w-8 h-8" />
            <Typography variant="small">{app.title}</Typography>
          </a>
        );
      })}
    </div>
  );
};
export default UserNavigation;
